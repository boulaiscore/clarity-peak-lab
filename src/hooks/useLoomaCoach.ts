import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type CoachStatus = "ready" | "submitted" | "streaming" | "error";

const COACH_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/looma-coach`;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useLoomaCoach() {
  const { session, getAccessToken } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [status, setStatus] = useState<CoachStatus>("ready");
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!session?.user.id) {
        setIsLoadingHistory(false);
        return;
      }
      const { data, error: historyError } = await supabase
        .from("coach_messages")
        .select("id, role, content")
        .order("created_at", { ascending: true })
        .limit(200);

      if (cancelled) return;
      if (historyError) {
        console.error("Failed to load coach history", historyError.message);
      } else if (data) {
        setMessages(
          data.map((row) => ({
            id: row.id,
            role: row.role === "assistant" ? "assistant" : "user",
            content: row.content,
          })),
        );
      }
      setIsLoadingHistory(false);
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("ready");
  }, []);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    setError(null);
    setNeedsUpgrade(false);
    setStatus("submitted");

    const userMessage: CoachMessage = { id: makeId("u"), role: "user", content: text };
    const assistantId = makeId("a");
    setMessages((previous) => [...previous, userMessage]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // ProtectedRoute only renders the Coach with a verified session. Use its
      // access token first instead of immediately reading Android secure
      // storage again: that second bridge read can temporarily return no
      // session even though the signed-in session is already live in React.
      let token = session?.access_token ?? await getAccessToken();
      if (!token) throw new Error("Sign in again to use the coach.");

      const requestCoach = (accessToken: string) => fetch(COACH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message: text }),
          signal: controller.signal,
        });

      let response = await requestCoach(token);
      if (response.status === 401) {
        token = await getAccessToken(true);
        if (!token) throw new Error("Your session has expired. Sign in again to use the coach.");
        response = await requestCoach(token);
      }

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 403 && payload?.error === "upgrade_required") {
          setNeedsUpgrade(true);
          setStatus("ready");
          setMessages((previous) => previous.filter((item) => item.id !== userMessage.id));
          return;
        }
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "The coach could not answer. Try again.",
        );
      }

      setStatus("streaming");
      setMessages((previous) => [...previous, { id: assistantId, role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((previous) =>
          previous.map((item) => (item.id === assistantId ? { ...item, content: answer } : item)),
        );
      }

      if (!answer.trim()) {
        setMessages((previous) =>
          previous.map((item) =>
            item.id === assistantId
              ? { ...item, content: "I could not put an answer together. Try asking again." }
              : item,
          ),
        );
      }

      setStatus("ready");
    } catch (caught) {
      if (controller.signal.aborted) {
        setStatus("ready");
        return;
      }
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
      setStatus("error");
      setMessages((previous) => previous.filter((item) => item.id !== assistantId));
    } finally {
      abortRef.current = null;
    }
  }, [getAccessToken, session?.access_token]);

  const clearConversation = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { error: deleteError } = await supabase
      .from("coach_messages")
      .delete()
      .eq("user_id", userId);
    if (deleteError) {
      setError("Could not clear the conversation.");
      return;
    }
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    status,
    error,
    needsUpgrade,
    isLoadingHistory,
    sendMessage,
    stop,
    clearConversation,
  };
}
