import { useAutoSeedExercises } from "@/hooks/useAutoSeedExercises";
import { useNotificationInit } from "@/hooks/useNotificationInit";
import { usePhoneHealthSync } from "@/hooks/usePhoneHealthSync";
import { useWearableSync } from "@/hooks/useWearableSync";
import { useDirectWearableAutoSync } from "@/hooks/useDirectWearableAutoSync";
import { useDeviceUsageSync } from "@/hooks/useDeviceUsageSync";
import { useCalendarContextSync } from "@/hooks/useCalendarContextSync";

/** Non-visual launch services that can safely start after first paint. */
export default function DeferredSyncServices() {
  useAutoSeedExercises();
  useNotificationInit();
  usePhoneHealthSync();
  useWearableSync();
  useDirectWearableAutoSync();
  useDeviceUsageSync();
  useCalendarContextSync();
  return null;
}
