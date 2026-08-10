/* global chrome */

const PAGE_SOURCE = "looma-app";
const SENSOR_SOURCE = "looma-desktop-sensor";
const ALLOWED_TYPES = new Set([
  "LOOMA_SENSOR_STATUS",
  "LOOMA_SENSOR_PAIR",
  "LOOMA_SENSOR_PULL",
  "LOOMA_SENSOR_ACK",
]);

window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    event.origin !== window.location.origin ||
    event.data?.source !== PAGE_SOURCE ||
    !ALLOWED_TYPES.has(event.data?.type) ||
    typeof event.data?.requestId !== "string" ||
    event.data.requestId.length > 100
  ) {
    return;
  }

  const message = {
    type: event.data.type,
    blockIds: Array.isArray(event.data.blockIds) ? event.data.blockIds.slice(0, 200) : undefined,
    accountKey: typeof event.data.accountKey === "string" ? event.data.accountKey : undefined,
  };
  chrome.runtime.sendMessage(message).then((payload) => {
    window.postMessage({
      source: SENSOR_SOURCE,
      requestId: event.data.requestId,
      payload,
    }, window.location.origin);
  }).catch(() => {
    window.postMessage({
      source: SENSOR_SOURCE,
      requestId: event.data.requestId,
      payload: { installed: false },
    }, window.location.origin);
  });
});
