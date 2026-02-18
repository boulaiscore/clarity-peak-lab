/**
 * Hook for Active Books - tracks books currently being read (max 2)
 * 
 * Integrates with reason_sessions for time tracking and RQ contribution.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay } from "date-fns";

export interface ActiveBook {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  source: string; // 'looma_list' | 'custom'
  item_id: string | null;
  cover_url: string | null;
  demand: string;
  total_minutes_read: number;
  status: string; // 'reading' | 'completed' | 'abandoned'
  started_at: string;
  completed_at: string | null;
  last_read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewActiveBook {
  title: string;
  author?: string;
  source: "looma_list" | "custom";
  item_id?: string;
  demand?: string;
}

const MAX_ACTIVE_BOOKS = 2;

export function useActiveBooks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["active-books", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("active_books")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "reading")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ActiveBook[];
    },
    enabled: !!user?.id,
  });
}

export function useAddActiveBook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (book: NewActiveBook) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check max limit
      const { count, error: countError } = await supabase
        .from("active_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "reading");
      if (countError) throw countError;
      if ((count || 0) >= MAX_ACTIVE_BOOKS) {
        throw new Error("Maximum 2 active books allowed");
      }

      const { data, error } = await supabase
        .from("active_books")
        .insert({
          user_id: user.id,
          title: book.title,
          author: book.author || null,
          source: book.source,
          item_id: book.item_id || null,
          demand: book.demand || "MEDIUM",
        })
        .select()
        .single();
      if (error) throw error;
      return data as ActiveBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-books"] });
    },
  });
}

export function useUpdateActiveBook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<ActiveBook, "status" | "total_minutes_read" | "last_read_at" | "completed_at">>) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("active_books")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as ActiveBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-books"] });
    },
  });
}

export function useCompleteActiveBook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("active_books")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", bookId)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as ActiveBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-books"] });
      queryClient.invalidateQueries({ queryKey: ["hybrid-rq-data"] });
    },
  });
}

export function useAbandonActiveBook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("active_books")
        .update({ status: "abandoned" })
        .eq("id", bookId)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as ActiveBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-books"] });
    },
  });
}

/** Check if user has read today for any of their active books */
export function useHasReadToday() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["has-read-today", user?.id],
    queryFn: async () => {
      if (!user?.id) return true; // default to true to avoid false prompts
      const todayStart = startOfDay(new Date()).toISOString();
      const { data, error } = await supabase
        .from("reason_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("session_type", "reading")
        .gte("started_at", todayStart)
        .not("ended_at", "is", null)
        .limit(1);
      if (error) throw error;
      return (data || []).length > 0;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });
}

/** Log manual reading minutes for an active book */
export function useLogManualReading() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, minutes, bookTitle, bookAuthor }: { bookId: string; minutes: number; bookTitle: string; bookAuthor?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // 1. Create a completed reason_session
      const now = new Date();
      const startedAt = new Date(now.getTime() - minutes * 60 * 1000);
      const { error: sessionError } = await supabase
        .from("reason_sessions")
        .insert({
          user_id: user.id,
          session_type: "reading",
          source: "custom",
          item_id: bookId,
          custom_title: bookTitle,
          custom_author: bookAuthor || null,
          weight: 1.4, // book weight
          started_at: startedAt.toISOString(),
          ended_at: now.toISOString(),
          duration_seconds: minutes * 60,
          proof_level: "timer_only",
          is_valid_for_rq: minutes >= 5,
        });
      if (sessionError) throw sessionError;

      // 2. Update total_minutes_read and last_read_at on the active book
      const { data: book } = await supabase
        .from("active_books")
        .select("total_minutes_read")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single();

      if (book) {
        await supabase
          .from("active_books")
          .update({
            total_minutes_read: (book.total_minutes_read || 0) + minutes,
            last_read_at: now.toISOString(),
          })
          .eq("id", bookId)
          .eq("user_id", user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-books"] });
      queryClient.invalidateQueries({ queryKey: ["reason-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["has-read-today"] });
      queryClient.invalidateQueries({ queryKey: ["reason-session-stats"] });
      queryClient.invalidateQueries({ queryKey: ["hybrid-rq-data"] });
    },
  });
}
