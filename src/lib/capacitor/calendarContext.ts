import { Capacitor, registerPlugin } from "@capacitor/core";

export type CalendarPermissionState =
  | "granted"
  | "denied"
  | "not_determined"
  | "unavailable";

export interface CalendarDayAggregate {
  date: string;
  busyMinutes: number;
  meetingCount: number;
  longestMeetingMinutes: number;
  firstEventMinute: number | null;
  lastEventMinute: number | null;
  longestOpenStartMinute: number | null;
  longestOpenMinutes: number;
}

interface CalendarContextPlugin {
  getPermissionStatus(): Promise<{ state: CalendarPermissionState }>;
  requestPermission(): Promise<{ state: CalendarPermissionState }>;
  getDailyAggregates(options: {
    startDate: string;
    endDate: string;
  }): Promise<{
    state: CalendarPermissionState;
    days: CalendarDayAggregate[];
  }>;
}

const CalendarContext = registerPlugin<CalendarContextPlugin>("CalendarContext", {
  web: {
    async getPermissionStatus() {
      return { state: "unavailable" as const };
    },
    async requestPermission() {
      return { state: "unavailable" as const };
    },
    async getDailyAggregates() {
      return { state: "unavailable" as const, days: [] };
    },
  },
});

export function isNativeMobile(): boolean {
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android";
}

export function calendarSource(): "ios_eventkit" | "android_calendar" | null {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios_eventkit";
  if (platform === "android") return "android_calendar";
  return null;
}

export default CalendarContext;
