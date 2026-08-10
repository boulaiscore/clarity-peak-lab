/* global chrome */

const status = document.getElementById("status");
const queued = document.getElementById("queued");
const tracking = document.getElementById("tracking");
const indicator = document.getElementById("indicator");

chrome.runtime.sendMessage({ type: "LOOMA_SENSOR_POPUP_STATUS" }).then((result) => {
  status.textContent = result?.installed ? "Active" : "Unavailable";
  queued.textContent = String(result?.queuedBlocks ?? 0);
  tracking.textContent = result?.tracking ? "FOCUS" : "IDLE";
  indicator.classList.toggle("idle", !result?.tracking);
}).catch(() => {
  status.textContent = "Unavailable";
  indicator.classList.add("idle");
});

document.getElementById("openLooma").addEventListener("click", () => {
  void chrome.tabs.create({ url: "https://clarity-peak-lab.lovable.app/#/app/dashboard" });
});
