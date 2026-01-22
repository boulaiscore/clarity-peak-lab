import { useEffect, useMemo, useRef, useState } from "react";

type UseHeroVideoLifecycleOptions = {
  prefersReducedMotion: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  introDelayMs?: number;
  outroMs?: number;
  fadeMs?: number;
};

/**
 * Controls the landing hero background video lifecycle:
 * - delayed start
 * - premium intro (blur + subtle zoom-out)
 * - low-volume autoplay w/ graceful fallback
 * - elegant outro fade that reveals the static image
 * - restarts when tab becomes visible again
 */
export function useHeroVideoLifecycle({
  prefersReducedMotion,
  videoRef,
  introDelayMs = 2000,
  outroMs = 1500,
  fadeMs = 1200,
}: UseHeroVideoLifecycleOptions) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoBlur, setVideoBlur] = useState(false);
  const [videoIntro, setVideoIntro] = useState(false);
  const [videoOutro, setVideoOutro] = useState(false);
  const [needsSoundEnable, setNeedsSoundEnable] = useState(false);

  const didTriggerOutroRef = useRef(false);
  const fadeTimerRef = useRef<number | undefined>(undefined);

  const resetToImage = () => {
    setShowVideo(false);
    setVideoBlur(false);
    setVideoIntro(false);
    setVideoOutro(false);
    setNeedsSoundEnable(false);
    didTriggerOutroRef.current = false;

    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const start = useMemo(() => {
    return () => {
      if (prefersReducedMotion) return;
      resetToImage();

      const t = window.setTimeout(async () => {
        setShowVideo(true);
        setVideoBlur(true);
        setVideoIntro(true);
        setVideoOutro(false);
        didTriggerOutroRef.current = false;

        const blurTimer = window.setTimeout(() => setVideoBlur(false), 900);
        const introTimer = window.setTimeout(() => setVideoIntro(false), 1200);

        const v = videoRef.current;
        if (!v) return;

        v.currentTime = 0;
        v.volume = 0.15;
        v.muted = false;

        try {
          await v.play();
        } catch {
          try {
            v.muted = true;
            await v.play();
            setNeedsSoundEnable(true);
          } catch {
            resetToImage();
          }
        }

        return () => {
          window.clearTimeout(blurTimer);
          window.clearTimeout(introTimer);
        };
      }, introDelayMs);

      return () => window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDelayMs, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const cleanupStart = start();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        videoRef.current?.pause();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cleanupStart?.();
      document.removeEventListener("visibilitychange", onVisibility);
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
  }, [prefersReducedMotion, start, videoRef]);

  // Enable sound on the first user gesture if we had to start muted.
  useEffect(() => {
    if (!needsSoundEnable) return;

    const enable = async () => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = false;
      v.volume = 0.25;
      try {
        await v.play();
      } catch {
        // no-op
      }
      setNeedsSoundEnable(false);
    };

    window.addEventListener("pointerdown", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });

    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, [needsSoundEnable, videoRef]);

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!Number.isFinite(v.duration) || v.duration <= 0) return;

    const remainingMs = (v.duration - v.currentTime) * 1000;
    if (remainingMs <= outroMs && !didTriggerOutroRef.current) {
      didTriggerOutroRef.current = true;
      setVideoOutro(true);
    }
  };

  const handleVideoEnded = () => {
    // keep the video element mounted but faded out, then fully reset
    if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = window.setTimeout(() => {
      resetToImage();
    }, fadeMs);
  };

  return {
    showVideo,
    videoBlur,
    videoIntro,
    videoOutro,
    handleVideoTimeUpdate,
    handleVideoEnded,
  };
}
