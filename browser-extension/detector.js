export const SENSOR_VERSION = "desktop-focus-v1";

export const DEFAULT_DETECTOR_CONFIG = Object.freeze({
  minimumFocusedMinutes: 10,
  idleEndMinutes: 5,
  attentionEndMinutes: 8,
  maximumSampleSeconds: 90,
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function emptyState() {
  return {
    block: null,
    lastSampleAt: null,
    lastActivity: "unsupported",
    lastCategory: "unsupported",
    lastSiteToken: null,
  };
}

export function createDetectorState() {
  return emptyState();
}

function startBlock(sample) {
  return {
    clientBlockId: crypto.randomUUID(),
    startedAt: sample.timestamp,
    lastWorkAt: sample.timestamp,
    activeSeconds: 0,
    focusedSeconds: 0,
    attentionSeconds: 0,
    idleSeconds: 0,
    interruptionCount: 0,
    contextSwitchCount: 0,
    currentContinuousSeconds: 0,
    longestContinuousSeconds: 0,
  };
}

function accrue(block, state, elapsedSeconds) {
  if (elapsedSeconds <= 0) return;

  if (state.lastActivity === "active") {
    block.activeSeconds += elapsedSeconds;
    if (state.lastCategory === "work") {
      block.focusedSeconds += elapsedSeconds;
      block.currentContinuousSeconds += elapsedSeconds;
      block.longestContinuousSeconds = Math.max(
        block.longestContinuousSeconds,
        block.currentContinuousSeconds,
      );
    } else if (state.lastCategory === "attention") {
      block.attentionSeconds += elapsedSeconds;
      block.currentContinuousSeconds = 0;
    }
  } else if (state.lastActivity === "idle" || state.lastActivity === "locked") {
    block.idleSeconds += elapsedSeconds;
    block.currentContinuousSeconds = 0;
  }
}

function finalizeBlock(block, endedAt, reason, config) {
  const focusedMinutes = block.focusedSeconds / 60;
  if (focusedMinutes < config.minimumFocusedMinutes) return null;

  const started = new Date(block.startedAt);
  const activeMinutes = block.activeSeconds / 60;
  const attentionShare = activeMinutes > 0
    ? block.attentionSeconds / block.activeSeconds
    : 0;
  const confidence = clamp(
    0.55 + Math.min(1, focusedMinutes / 90) * 0.35 - attentionShare * 0.1,
    0.4,
    0.9,
  );

  return {
    clientBlockId: block.clientBlockId,
    source: "chrome_extension",
    sensorVersion: SENSOR_VERSION,
    startedAt: new Date(block.startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    localDate: [
      started.getFullYear(),
      String(started.getMonth() + 1).padStart(2, "0"),
      String(started.getDate()).padStart(2, "0"),
    ].join("-"),
    localStartHour: started.getHours(),
    localWeekday: started.getDay(),
    timezoneOffsetMinutes: started.getTimezoneOffset(),
    durationMinutes: round(Math.max(0, endedAt - block.startedAt) / 60_000, 1),
    activeMinutes: round(activeMinutes, 1),
    focusedMinutes: round(focusedMinutes, 1),
    attentionMinutes: round(block.attentionSeconds / 60, 1),
    idleMinutes: round(block.idleSeconds / 60, 1),
    interruptionCount: block.interruptionCount,
    contextSwitchCount: block.contextSwitchCount,
    longestContinuousMinutes: round(block.longestContinuousSeconds / 60, 1),
    endedAbruptly: focusedMinutes < 15 && reason !== "manual_flush",
    terminationReason: reason,
    confidence: round(confidence, 3),
  };
}

/**
 * Advances the detector with an aggregate activity sample. `siteToken` is used
 * only inside chrome.storage.session to count switches and is never returned.
 */
export function advanceDetector(
  previousState,
  sample,
  config = DEFAULT_DETECTOR_CONFIG,
) {
  const state = {
    ...emptyState(),
    ...previousState,
    block: previousState?.block ? { ...previousState.block } : null,
  };
  const timestamp = Number(sample.timestamp);
  if (!Number.isFinite(timestamp)) {
    return { state, completedBlock: null };
  }

  if (state.block && Number.isFinite(state.lastSampleAt)) {
    const elapsedSeconds = clamp(
      (timestamp - state.lastSampleAt) / 1000,
      0,
      config.maximumSampleSeconds,
    );
    accrue(state.block, state, elapsedSeconds);
  }

  const isActiveWork = sample.activity === "active" && sample.category === "work";
  if (!state.block && isActiveWork) {
    state.block = startBlock(sample);
  } else if (state.block) {
    const leftWork = state.lastActivity === "active" &&
      state.lastCategory === "work" &&
      !isActiveWork;
    if (leftWork && (sample.category === "attention" || sample.activity !== "active")) {
      state.block.interruptionCount += 1;
      state.block.currentContinuousSeconds = 0;
    }

    if (
      isActiveWork &&
      state.lastActivity === "active" &&
      state.lastCategory === "work" &&
      state.lastSiteToken &&
      sample.siteToken &&
      state.lastSiteToken !== sample.siteToken
    ) {
      state.block.contextSwitchCount += 1;
    }

    if (isActiveWork) {
      state.block.lastWorkAt = timestamp;
    }
  }

  let completedBlock = null;
  if (state.block && !isActiveWork) {
    const gapMinutes = (timestamp - state.block.lastWorkAt) / 60_000;
    const isIdle = sample.activity === "idle" || sample.activity === "locked";
    const threshold = isIdle ? config.idleEndMinutes : config.attentionEndMinutes;
    if (gapMinutes >= threshold) {
      const reason = isIdle
        ? sample.activity
        : sample.category === "attention" ? "attention_gap" : "unsupported_gap";
      completedBlock = finalizeBlock(state.block, timestamp, reason, config);
      state.block = null;
    }
  }

  state.lastSampleAt = timestamp;
  state.lastActivity = sample.activity;
  state.lastCategory = sample.category;
  state.lastSiteToken = sample.siteToken ?? null;

  return { state, completedBlock };
}

export function flushDetector(
  previousState,
  timestamp = Date.now(),
  config = DEFAULT_DETECTOR_CONFIG,
) {
  const state = {
    ...emptyState(),
    ...previousState,
    block: previousState?.block ? { ...previousState.block } : null,
  };
  if (!state.block) return { state, completedBlock: null };

  if (Number.isFinite(state.lastSampleAt)) {
    accrue(
      state.block,
      state,
      clamp((timestamp - state.lastSampleAt) / 1000, 0, config.maximumSampleSeconds),
    );
  }
  const completedBlock = finalizeBlock(state.block, timestamp, "manual_flush", config);
  return { state: emptyState(), completedBlock };
}
