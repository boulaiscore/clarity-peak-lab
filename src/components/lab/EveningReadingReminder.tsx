/**
 * Evening Reading Reminder
 * Shows a banner after 9 PM if user has active books but hasn't logged reading today.
 * Also schedules a push notification via Capacitor Local Notifications.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveBooks, useHasReadToday } from "@/hooks/useActiveBooks";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const REMINDER_HOUR = 21; // 9 PM
const DISMISSED_KEY = "evening-reading-reminder-dismissed";

export function EveningReadingReminder() {
  const { data: activeBooks = [] } = useActiveBooks();
  const { data: hasReadToday } = useHasReadToday();
  const [dismissed, setDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  // Check if it's after 9 PM and user has active books but hasn't read
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const today = now.toDateString();
    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === today;

    if (
      hour >= REMINDER_HOUR &&
      activeBooks.length > 0 &&
      hasReadToday === false &&
      !wasDismissed
    ) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [activeBooks, hasReadToday]);

  // Schedule push notification for 9 PM if on native platform
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (activeBooks.length === 0) return;

    const scheduleReminder = async () => {
      try {
        const { display } = await LocalNotifications.checkPermissions();
        if (display !== "granted") {
          const result = await LocalNotifications.requestPermissions();
          if (result.display !== "granted") return;
        }

        // Cancel existing reading reminders
        const pending = await LocalNotifications.getPending();
        const readingNotifs = pending.notifications.filter(
          (n) => n.id >= 9000 && n.id < 9100
        );
        if (readingNotifs.length > 0) {
          await LocalNotifications.cancel({ notifications: readingNotifs });
        }

        // Schedule for 9 PM today (or tomorrow if past 9 PM)
        const now = new Date();
        const target = new Date();
        target.setHours(REMINDER_HOUR, 0, 0, 0);
        if (now > target) {
          target.setDate(target.getDate() + 1);
        }

        const bookTitles = activeBooks
          .map((b) => b.title)
          .slice(0, 2)
          .join(" & ");

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 9001,
              title: "Did you read today? 📚",
              body: `You're reading "${bookTitles}". Even 10 minutes builds your RQ.`,
              schedule: { at: target },
              sound: undefined,
              smallIcon: "ic_stat_icon_config_sample",
              actionTypeId: "READING_REMINDER",
            },
          ],
        });
      } catch (err) {
        console.warn("Failed to schedule reading reminder:", err);
      }
    };

    scheduleReminder();
  }, [activeBooks]);

  const handleDismiss = () => {
    setDismissed(true);
    setShouldShow(false);
    localStorage.setItem(DISMISSED_KEY, new Date().toDateString());
  };

  return (
    <AnimatePresence>
      {shouldShow && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-4 right-4 z-50 p-4 rounded-2xl border border-amber-500/30 bg-card shadow-lg shadow-black/20"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-0.5">
                Did you read today?
              </h4>
              <p className="text-[11px] text-muted-foreground mb-2">
                You're reading{" "}
                <span className="text-foreground font-medium">
                  {activeBooks.map((b) => b.title).join(" & ")}
                </span>
                . Even 10 minutes supports your Reasoning Quality.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-[10px] gap-1"
                  onClick={handleDismiss}
                >
                  <Clock className="w-3 h-3" />
                  Log time now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px]"
                  onClick={handleDismiss}
                >
                  Not today
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
