/**
 * Hook to manage in-progress tasks with start dates
 * Stores data in localStorage for persistence across sessions
 */

import { useState, useCallback, useMemo } from "react";
import { PODCASTS } from "@/data/podcasts";
import { READINGS } from "@/data/readings";

export interface InProgressTask {
  id: string;
  startedAt: string; // ISO date string
  type: "podcast" | "book" | "article";
  title: string;
}

interface InProgressData {
  [contentId: string]: {
    startedAt: string;
    type: "podcast" | "book" | "article";
  };
}

const STORAGE_KEY = "task-in-progress-data";
const LEGACY_STORAGE_KEY = "task-in-progress-ids";

// Get task details from content libraries
function getTaskDetails(contentId: string): { type: "podcast" | "book" | "article"; title: string } | null {
  // Check podcasts
  const podcast = PODCASTS.find(p => p.id === contentId);
  if (podcast) {
    return { type: "podcast", title: podcast.title };
  }
  
  // Check readings
  const reading = READINGS.find(r => r.id === contentId);
  if (reading) {
    return { 
      type: reading.readingType === "BOOK" ? "book" : "article", 
      title: reading.title 
    };
  }
  
  return null;
}

export function useInProgressTasks() {
  const [inProgressData, setInProgressData] = useState<InProgressData>(() => {
    try {
      // Try new format first
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Migrate from legacy format if exists
      const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyStored) {
        const legacyIds: string[] = JSON.parse(legacyStored);
        const migrated: InProgressData = {};
        legacyIds.forEach(id => {
          const details = getTaskDetails(id);
          if (details) {
            migrated[id] = {
              startedAt: new Date().toISOString(),
              type: details.type,
            };
          }
        });
        // Save migrated data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        // Keep legacy for backwards compatibility with SpotifyTasksView
        return migrated;
      }
      
      return {};
    } catch {
      return {};
    }
  });

  const inProgressIds = useMemo(() => Object.keys(inProgressData), [inProgressData]);

  const markAsInProgress = useCallback((contentId: string, type: "podcast" | "book" | "article") => {
    setInProgressData(prev => {
      if (prev[contentId]) return prev; // Already in progress
      
      const newData = {
        ...prev,
        [contentId]: {
          startedAt: new Date().toISOString(),
          type,
        },
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      // Also update legacy format for backwards compatibility
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(Object.keys(newData)));
      
      return newData;
    });
  }, []);

  const removeFromInProgress = useCallback((contentId: string) => {
    setInProgressData(prev => {
      const { [contentId]: _, ...rest } = prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(Object.keys(rest)));
      return rest;
    });
  }, []);

  const getInProgressTasks = useCallback((): InProgressTask[] => {
    return Object.entries(inProgressData).map(([id, data]) => {
      const details = getTaskDetails(id);
      return {
        id,
        startedAt: data.startedAt,
        type: data.type,
        title: details?.title || id,
      };
    }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [inProgressData]);

  const isInProgress = useCallback((contentId: string) => {
    return contentId in inProgressData;
  }, [inProgressData]);

  return {
    inProgressIds,
    inProgressData,
    markAsInProgress,
    removeFromInProgress,
    getInProgressTasks,
    isInProgress,
  };
}
