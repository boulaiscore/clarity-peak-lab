export const DESKTOP_SENSOR_PAGE_SOURCE = "looma-app";
export const DESKTOP_SENSOR_EXTENSION_SOURCE = "looma-desktop-sensor";

export interface DesktopSensorStatus {
  installed: boolean;
  sensorVersion: string | null;
  tracking: boolean;
}

export interface DesktopSensorBlockAggregate {
  clientBlockId: string;
  source: "chrome_extension";
  sensorVersion: string;
  startedAt: string;
  endedAt: string;
  localDate: string;
  localStartHour: number;
  localWeekday: number;
  timezoneOffsetMinutes: number;
  durationMinutes: number;
  activeMinutes: number;
  focusedMinutes: number;
  attentionMinutes: number;
  idleMinutes: number;
  interruptionCount: number;
  contextSwitchCount: number;
  longestContinuousMinutes: number;
  endedAbruptly: boolean;
  terminationReason: "idle" | "locked" | "attention_gap" | "unsupported_gap" | "manual_flush";
  confidence: number;
}

type SensorRequestType =
  | "LOOMA_SENSOR_STATUS"
  | "LOOMA_SENSOR_PAIR"
  | "LOOMA_SENSOR_PULL"
  | "LOOMA_SENSOR_ACK";

interface SensorEnvelope {
  source: typeof DESKTOP_SENSOR_EXTENSION_SOURCE;
  requestId: string;
  payload?: unknown;
}

function requestSensor(
  type: SensorRequestType,
  extra: Record<string, unknown> = {},
  timeoutMs = 1_200,
): Promise<unknown> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(event: MessageEvent<SensorEnvelope>) {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.source !== DESKTOP_SENSOR_EXTENSION_SOURCE ||
        event.data.requestId !== requestId
      ) {
        return;
      }
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(event.data.payload ?? null);
    }

    window.addEventListener("message", onMessage);
    window.postMessage({
      source: DESKTOP_SENSOR_PAGE_SOURCE,
      type,
      requestId,
      ...extra,
    }, window.location.origin);
  });
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export async function getDesktopSensorStatus(): Promise<DesktopSensorStatus> {
  const payload = record(await requestSensor("LOOMA_SENSOR_STATUS"));
  return {
    installed: payload?.installed === true,
    sensorVersion: typeof payload?.sensorVersion === "string" ? payload.sensorVersion : null,
    tracking: payload?.tracking === true,
  };
}

export async function pairDesktopSensor(accountKey: string): Promise<DesktopSensorStatus> {
  const payload = record(await requestSensor("LOOMA_SENSOR_PAIR", { accountKey }));
  return {
    installed: payload?.installed === true,
    sensorVersion: typeof payload?.sensorVersion === "string" ? payload.sensorVersion : null,
    tracking: payload?.tracking === true,
  };
}

export async function pullDesktopSensorBlocks(accountKey: string): Promise<{
  status: DesktopSensorStatus;
  blocks: unknown[];
}> {
  const payload = record(await requestSensor("LOOMA_SENSOR_PULL", { accountKey }, 2_000));
  return {
    status: {
      installed: payload?.installed === true,
      sensorVersion: typeof payload?.sensorVersion === "string" ? payload.sensorVersion : null,
      tracking: payload?.tracking === true,
    },
    blocks: Array.isArray(payload?.blocks) ? payload.blocks : [],
  };
}

export async function acknowledgeDesktopSensorBlocks(
  accountKey: string,
  blockIds: string[],
): Promise<void> {
  if (blockIds.length === 0) return;
  await requestSensor("LOOMA_SENSOR_ACK", { accountKey, blockIds: blockIds.slice(0, 200) });
}
