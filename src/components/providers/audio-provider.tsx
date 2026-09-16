"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Howl } from "howler";
import { useExperience } from "@/lib/store/experience";

/**
 * Ambient background music system.
 *
 * Browsers block autoplay-with-sound, so playback can only begin from a user
 * gesture — the home preloader's "ENTER EXPERIENCE" button (or the mute toggle)
 * calls `start()`. The track then keeps playing across every route because this
 * provider lives in the root layout. Mute state persists in sessionStorage.
 *
 * PLACEHOLDER AUDIO: /public/audio/ambient-theme.mp3 (synthesized drone).
 * Swap with a real royalty-free moody instrumental, keep the same filename.
 */

interface AmbientAudioApi {
  started: boolean;
  muted: boolean;
  audioAvailable: boolean | null;
  audioEnabled: boolean;
  start: () => void;
  toggleMute: () => void;
}

const noop = () => {};
const AmbientAudioCtx = createContext<AmbientAudioApi>({
  started: false,
  muted: false,
  audioAvailable: null,
  audioEnabled: true,
  start: noop,
  toggleMute: noop,
});

export function useAmbientAudio(): AmbientAudioApi {
  return useContext(AmbientAudioCtx);
}

const TARGET_VOLUME = 0.16; // ~16% — subtle, never intrusive

/**
 * `enabled` comes from /admin/settings (site-wide feature toggle).
 * `src` is the managed asset URL for the ambient track.
 */
export function AudioProvider({
  children,
  enabled = true,
  src = "/audio/ambient-theme.mp3",
}: {
  children: React.ReactNode;
  enabled?: boolean;
  src?: string;
}) {
  const muted = useExperience((s) => s.muted);
  const setMuted = useExperience((s) => s.setMuted);
  const audioAvailable = useExperience((s) => s.audioAvailable);
  const setAudioAvailable = useExperience((s) => s.setAudioAvailable);

  const howlRef = useRef<Howl | null>(null);
  const startingRef = useRef(false);
  const [started, setStarted] = useState(false);
  const mutedRef = useRef(muted);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    mutedRef.current = muted;
    // Apply live mute changes to a playing track
    if (howlRef.current) howlRef.current.mute(muted);
  }, [muted]);

  const start = useCallback(() => {
    if (!enabledRef.current || howlRef.current || startingRef.current) return;
    startingRef.current = true;
    import("howler")
      .then(({ Howl }) => {
        const howl = new Howl({
          src: [src],
          loop: true,
          volume: 0,
          html5: true,
          autoplay: false,
        });
        howlRef.current = howl;
        howl.once("load", () => {
          startingRef.current = false;
          setAudioAvailable(true);
          setStarted(true);
          howl.play();
          howl.fade(0, TARGET_VOLUME, 2500); // smooth 2.5s fade-in
          if (mutedRef.current) howl.mute(true);
        });
        howl.once("loaderror", () => {
          startingRef.current = false;
          howlRef.current = null;
          setAudioAvailable(false);
        });
        howl.once("playerror", () => {
          startingRef.current = false;
          howlRef.current = null;
          setAudioAvailable(false);
        });
      })
      .catch(() => {
        startingRef.current = false;
        setAudioAvailable(false);
      });
  }, [setAudioAvailable, src]);

  const toggleMute = useCallback(() => {
    if (!enabledRef.current) return;
    const next = !mutedRef.current;
    setMuted(next);
    if (!howlRef.current) {
      // First interaction may come from the toggle itself (valid gesture)
      if (!next) start();
      return;
    }
    howlRef.current.mute(next);
  }, [setMuted, start]);

  return (
    <AmbientAudioCtx.Provider
      value={{ started, muted, audioAvailable, audioEnabled: enabled, start, toggleMute }}
    >
      {children}
    </AmbientAudioCtx.Provider>
  );
}
