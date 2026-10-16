// Audio and Speech Alert Engine for Posture Air AI
// Uses Web Audio API for harmonic Apple-like chimes and Web Speech API for voice coaching.

import type { Profile } from "./posture-store";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes a gentle, premium Apple-style chime chord using Web Audio API.
 * Uses 528Hz harmonic frequencies with exponential decay so it feels soft and non-intrusive.
 */
export function playGentleChime(type: "gentle" | "warning" | "success" = "gentle") {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Frequencies for chords:
  // gentle: warm major chord (528Hz, 660Hz, 792Hz)
  // warning: subtle minor inflection (440Hz, 523Hz)
  // success: ascending double chime
  const freqs =
    type === "success"
      ? [523.25, 659.25, 783.99]
      : type === "warning"
        ? [440, 554.37]
        : [528, 660];

  const duration = type === "warning" ? 0.7 : 0.9;

  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(f, now + idx * 0.04);

    oscGain.gain.setValueAtTime(0.8 / freqs.length, now);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(now + idx * 0.04);
    osc.stop(now + duration + 0.1);
  });
}

/**
 * Triggers subtle device vibration if supported.
 */
export function triggerHaptic(pattern: number[] = [80, 40, 80]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

/**
 * Speaks a natural Portuguese instruction using the Web Speech Synthesis API.
 */
export function speakCoachMessage(text: string, voicePreference: "female" | "male" = "female") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel(); // cancel pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = voicePreference === "female" ? 1.15 : 0.9;

    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter((v) => v.lang.startsWith("pt") || v.lang.includes("BR") || v.lang.includes("PT"));

    if (ptVoices.length > 0) {
      // Pick suitable voice if available
      const preferred = ptVoices.find((v) => {
        const name = v.name.toLowerCase();
        if (voicePreference === "female") {
          return name.includes("maria") || name.includes("luciana") || name.includes("female") || name.includes("mulher") || name.includes("helena") || name.includes("francisca");
        } else {
          return name.includes("daniel") || name.includes("felipe") || name.includes("male") || name.includes("homem") || name.includes("jorge");
        }
      });
      utterance.voice = preferred ?? ptVoices[0];
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
}

/**
 * Dispatches the posture alert based on the user's active Profile preferences.
 */
export function triggerPostureAlert(
  message: string,
  profile: Pick<Profile, "voice">,
  chimeType: "gentle" | "warning" = "warning"
) {
  triggerHaptic([100, 50, 100]);

  if (profile.voice === "vibration") {
    // Only haptic
    return;
  }

  if (profile.voice === "tone") {
    playGentleChime(chimeType);
    return;
  }

  // Play subtle chime first, then voice
  playGentleChime(chimeType);
  setTimeout(() => {
    speakCoachMessage(message, profile.voice === "male" ? "male" : "female");
  }, 220);
}

/**
 * Previews an alert so the user can test the sound in the Profile screen.
 */
export function testAlertSound(profile: Pick<Profile, "voice">) {
  if (profile.voice === "vibration") {
    triggerHaptic([120, 80, 120]);
    return;
  }
  if (profile.voice === "tone") {
    playGentleChime("gentle");
    return;
  }
  playGentleChime("gentle");
  setTimeout(() => {
    speakCoachMessage("Postura alinhada e ombros relaxados", profile.voice === "male" ? "male" : "female");
  }, 250);
}
