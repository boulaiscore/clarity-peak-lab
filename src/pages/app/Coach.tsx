import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Trash2, X } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { useLoomaCoach } from "@/hooks/useLoomaCoach";

const SUGGESTIONS = [
  "What should I protect today?",
  "How did my sleep affect my focus this month?",
  "When is my best focus window?",
  "Am I training too much?",
  "What changed in my Sharpness in the last 30 days?",
];

export default function Coach() {
  const navigate = useNavigate();
  const {
    messages,
    status,
    error,
    needsUpgrade,
    isLoadingHistory,
    sendMessage,
    stop,
    clearConversation,
  } = useLoomaCoach();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy, messages.length]);

  const handleSend = (text: string) => {
    void sendMessage(text);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),hsl(var(--background))_38%)]">
      <header className="flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Close coach"
          onClick={() => navigate("/app")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/[0.06]"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/85">
            LOOMA Coach
          </p>
          <p className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-muted-foreground/50">
            Based on your last 30 days
          </p>
        </div>
        <button
          type="button"
          aria-label="Clear conversation"
          onClick={() => void clearConversation()}
          disabled={messages.length === 0 || isBusy}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/55 transition-colors hover:bg-foreground/[0.06] disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </header>

      {needsUpgrade ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-foreground/12 bg-foreground/[0.04]">
            <Lock className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
          </span>
          <h1 className="mt-5 text-[19px] font-medium leading-snug text-foreground/95">
            LOOMA Coach is part of Pro
          </h1>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground/70">
            Ask questions about your own data and get answers built on your last 30 days of
            recovery, sleep and cognitive scores.
          </p>
          <Button
            type="button"
            className="mt-7 h-11 w-full max-w-xs rounded-full"
            onClick={() => navigate("/app/subscription")}
          >
            See plans
          </Button>
        </div>
      ) : (
        <>
          <Conversation className="flex-1">
            <ConversationContent className="mx-auto w-full max-w-md gap-6 px-4 pb-6">
              {isLoadingHistory ? (
                <div className="space-y-3 pt-6">
                  <div className="h-3 w-40 animate-pulse rounded bg-muted/60" />
                  <div className="h-3 w-56 animate-pulse rounded bg-muted/40" />
                </div>
              ) : messages.length === 0 ? (
                <div className="pt-10">
                  <p className="text-[19px] font-medium leading-snug text-foreground/95">
                    Ask about your own data.
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground/70">
                    I can read your last 30 days: recovery, sleep, heart rate, screen habits,
                    Drills and Quality Time.
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSend(suggestion)}
                        className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-left text-[13px] text-foreground/80 transition-colors hover:bg-white/[0.06]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.role === "assistant" ? (
                        <MessageResponse>{message.content}</MessageResponse>
                      ) : (
                        <p className="text-[14px] leading-relaxed">{message.content}</p>
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}

              {status === "submitted" && (
                <Shimmer className="text-[13px]">Reading your data…</Shimmer>
              )}

              {error && (
                <p className="text-[12px] leading-relaxed text-destructive/90">{error}</p>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="mx-auto w-full max-w-md px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <PromptInput
              onSubmit={(message, event) => {
                event.preventDefault();
                const text = message.text ?? "";
                if (!text.trim() || isBusy) return;
                event.currentTarget.reset();
                handleSend(text);
              }}
            >
              <PromptInputTextarea
                ref={textareaRef}
                placeholder="Ask LOOMA anything"
                disabled={isBusy}
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  status={status === "error" ? "error" : status}
                  onStop={stop}
                />
              </PromptInputFooter>
            </PromptInput>
            <p className="mt-2 text-center text-[9px] leading-relaxed text-muted-foreground/40">
              Answers use your recorded data only. Not medical advice.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
