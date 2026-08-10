/* global chrome */

import {
  SENSOR_VERSION,
  advanceDetector,
  createDetectorState,
} from "./detector.js";

const SAMPLE_ALARM = "looma-focus-sample";
const SESSION_STATE_KEY = "loomaDetectorState";
const COMPLETED_BLOCKS_KEY = "loomaCompletedBlocks";
const OWNER_KEY = "loomaOwnerKey";
const MAX_QUEUED_BLOCKS = 200;

const ATTENTION_HOSTS = [
  "instagram.com",
  "facebook.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "reddit.com",
  "youtube.com",
  "twitch.tv",
  "pinterest.com",
  "netflix.com",
];

const LOOMA_HOSTS = [
  "clarity-peak-lab.lovable.app",
  "lovableproject.com",
  "localhost",
  "127.0.0.1",
];

function hostMatches(hostname, candidates) {
  return candidates.some((candidate) =>
    hostname === candidate || hostname.endsWith(`.${candidate}`),
  );
}

function classifyUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { category: "unsupported", siteToken: null };
    }
    if (hostMatches(url.hostname, LOOMA_HOSTS)) {
      return { category: "unsupported", siteToken: null };
    }
    return {
      category: hostMatches(url.hostname, ATTENTION_HOSTS) ? "attention" : "work",
      siteToken: url.hostname,
    };
  } catch {
    return { category: "unsupported", siteToken: null };
  }
}

async function ensureAlarm() {
  const alarm = await chrome.alarms.get(SAMPLE_ALARM);
  if (!alarm) {
    await chrome.alarms.create(SAMPLE_ALARM, { periodInMinutes: 1 });
  }
}

async function readDetectorState() {
  const stored = await chrome.storage.session.get(SESSION_STATE_KEY);
  return stored[SESSION_STATE_KEY] ?? createDetectorState();
}

async function writeDetectorState(state) {
  await chrome.storage.session.set({ [SESSION_STATE_KEY]: state });
}

async function queueCompletedBlock(block, ownerKey) {
  if (!block) return;
  const stored = await chrome.storage.local.get(COMPLETED_BLOCKS_KEY);
  const blocks = Array.isArray(stored[COMPLETED_BLOCKS_KEY])
    ? stored[COMPLETED_BLOCKS_KEY]
    : [];
  const ownedBlock = { ...block, ownerKey };
  const next = [...blocks.filter((item) => item.clientBlockId !== block.clientBlockId), ownedBlock]
    .slice(-MAX_QUEUED_BLOCKS);
  await chrome.storage.local.set({ [COMPLETED_BLOCKS_KEY]: next });
}

async function getCurrentSample(forcedActivity = null) {
  const activity = forcedActivity ?? await chrome.idle.queryState(60);
  if (activity !== "active") {
    return {
      timestamp: Date.now(),
      activity,
      category: "unsupported",
      siteToken: null,
    };
  }

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const classified = classifyUrl(tab?.url ?? "");
  return {
    timestamp: Date.now(),
    activity: "active",
    ...classified,
  };
}

let sampleChain = Promise.resolve();

function scheduleSample(forcedActivity = null) {
  sampleChain = sampleChain.then(async () => {
    const ownerStore = await chrome.storage.local.get(OWNER_KEY);
    const ownerKey = ownerStore[OWNER_KEY];
    if (typeof ownerKey !== "string") return;
    const [state, sample] = await Promise.all([
      readDetectorState(),
      getCurrentSample(forcedActivity),
    ]);
    const result = advanceDetector(state, sample);
    await writeDetectorState(result.state);
    await queueCompletedBlock(result.completedBlock, ownerKey);
    await updateBadge(result.state);
  }).catch(() => {
    // The sensor must never interfere with browsing.
  });
}

async function updateBadge(state) {
  const isTracking = Boolean(state.block);
  await chrome.action.setBadgeText({ text: isTracking ? "•" : "" });
  if (isTracking) {
    await chrome.action.setBadgeBackgroundColor({ color: "#4670AC" });
  }
}

function isAllowedBridgeSender(sender) {
  try {
    const url = new URL(sender.tab?.url ?? "");
    return hostMatches(url.hostname, LOOMA_HOSTS);
  } catch {
    return false;
  }
}

function isAccountKey(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureAlarm();
  chrome.idle.setDetectionInterval(60);
  scheduleSample();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureAlarm();
  chrome.idle.setDetectionInterval(60);
  scheduleSample();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SAMPLE_ALARM) scheduleSample();
});

chrome.tabs.onActivated.addListener(() => scheduleSample());
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") scheduleSample();
});
chrome.windows.onFocusChanged.addListener(() => scheduleSample());
chrome.idle.onStateChanged.addListener((state) => scheduleSample(state));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handle = async () => {
    if (message?.type === "LOOMA_SENSOR_POPUP_STATUS" && sender.url?.startsWith("chrome-extension://")) {
      const [session, local] = await Promise.all([
        readDetectorState(),
        chrome.storage.local.get(COMPLETED_BLOCKS_KEY),
      ]);
      return {
        installed: true,
        sensorVersion: SENSOR_VERSION,
        tracking: Boolean(session.block),
        queuedBlocks: Array.isArray(local[COMPLETED_BLOCKS_KEY])
          ? local[COMPLETED_BLOCKS_KEY].length
          : 0,
      };
    }

    if (!isAllowedBridgeSender(sender)) return { ok: false };

    if (message?.type === "LOOMA_SENSOR_STATUS") {
      const [state, owner] = await Promise.all([
        readDetectorState(),
        chrome.storage.local.get(OWNER_KEY),
      ]);
      return {
        installed: true,
        sensorVersion: SENSOR_VERSION,
        tracking: Boolean(state.block),
        paired: typeof owner[OWNER_KEY] === "string",
      };
    }

    if (message?.type === "LOOMA_SENSOR_PAIR" && isAccountKey(message.accountKey)) {
      const owner = await chrome.storage.local.get(OWNER_KEY);
      if (owner[OWNER_KEY] !== message.accountKey) {
        await chrome.storage.local.set({ [OWNER_KEY]: message.accountKey });
        await writeDetectorState(createDetectorState());
        scheduleSample();
      }
      return {
        installed: true,
        sensorVersion: SENSOR_VERSION,
        tracking: false,
        paired: true,
      };
    }

    if (message?.type === "LOOMA_SENSOR_PULL" && isAccountKey(message.accountKey)) {
      const [stored, state] = await Promise.all([
        chrome.storage.local.get(COMPLETED_BLOCKS_KEY),
        readDetectorState(),
      ]);
      return {
        installed: true,
        sensorVersion: SENSOR_VERSION,
        tracking: Boolean(state.block),
        blocks: Array.isArray(stored[COMPLETED_BLOCKS_KEY])
          ? stored[COMPLETED_BLOCKS_KEY]
              .filter((block) => block.ownerKey === message.accountKey)
              .map(({ ownerKey: _ownerKey, ...block }) => block)
          : [],
      };
    }

    if (
      message?.type === "LOOMA_SENSOR_ACK" &&
      isAccountKey(message.accountKey) &&
      Array.isArray(message.blockIds)
    ) {
      const accepted = new Set(
        message.blockIds.filter((value) => typeof value === "string").slice(0, 200),
      );
      const stored = await chrome.storage.local.get(COMPLETED_BLOCKS_KEY);
      const current = Array.isArray(stored[COMPLETED_BLOCKS_KEY])
        ? stored[COMPLETED_BLOCKS_KEY]
        : [];
      await chrome.storage.local.set({
        [COMPLETED_BLOCKS_KEY]: current.filter((block) =>
          block.ownerKey !== message.accountKey || !accepted.has(block.clientBlockId),
        ),
      });
      return { ok: true };
    }

    return { ok: false };
  };

  handle().then(sendResponse).catch(() => sendResponse({ ok: false }));
  return true;
});

void ensureAlarm();
chrome.idle.setDetectionInterval(60);
scheduleSample();
