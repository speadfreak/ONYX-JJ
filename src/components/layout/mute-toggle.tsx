"use client";

import { useAmbientAudio } from "@/components/providers/audio-provider";
import { useExperience } from "@/lib/store/experience";
import { cn } from "@/lib/utils";

/**
 * Persistent mute/unmute control — visible on every page (lives in the header).
 * Animated pulsing sound-wave bars while audio is live; crossed-out when muted.
 * If the ambient track is missing (placeholder not generated), the toggle
 * renders in a disabled state rather than lying to the user.
 */
export function MuteToggle() {
  const { started, muted, audioAvailable, audioEnabled, toggleMute } = useAmbientAudio();
  const setMuted = useExperience((s) => s.setMuted);
  // Site-wide audio disabled from /admin/settings → no control at all
  if (!audioEnabled) return null;
  const disabled = audioAvailable === false;

  return (
    <button
      onClick={() => {
        toggleMute();
        // keep store in sync when audio isn't started yet (toggleMute handles playback)
        if (!started && muted) setMuted(false);
      }}
      disabled={disabled}
      aria-label={muted ? "Unmute ambient music" : "Mute ambient music"}
      aria-pressed={!muted}
      title={disabled ? "Ambient audio placeholder not found — drop /audio/ambient-theme.mp3" : muted ? "Unmute ambient music" : "Mute ambient music"}
      className={cn(
        "group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300",
        disabled
          ? "cursor-not-allowed border-white/5 opacity-40"
          : "border-white/10 bg-onyx-900/60 backdrop-blur-sm hover:border-gold/50 hover:shadow-[0_0_18px_-4px_rgba(212,168,87,0.5)]"
      )}
    >
      {/* sound-wave bars */}
      <span className="flex h-4 items-end gap-[3px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[2.5px] rounded-full bg-gold transition-all duration-300",
              muted || disabled ? "h-[5px] opacity-50" : "eq-bar h-full opacity-90"
            )}
            style={!muted && !disabled ? { animationDelay: `${i * 0.14}s` } : undefined}
          />
        ))}
      </span>
      {/* mute cross */}
      {(muted || disabled) && (
        <span aria-hidden className="absolute h-[1.5px] w-5 rotate-45 rounded bg-gold/80" />
      )}
      {/* soft pulse ring when playing */}
      {!muted && !disabled && started && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-gold/30 animate-pulse-soft"
        />
      )}
    </button>
  );
}
