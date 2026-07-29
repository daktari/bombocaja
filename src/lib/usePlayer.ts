import { useEffect, useMemo, useRef, useState } from "react";
import { parsePattern } from "./parser";
import { audioEngine, DEFAULT_BPM } from "./audioEngine";

export interface PlayerOptions {
  bpm?: number;
  volume?: number;
  laneGains?: number[];
  /** Called when a token becomes audible — powers the editor hit-flash. */
  onFlash?: (from: number, to: number) => void;
}

/**
 * Shared play/stop state for any view with a code box.
 * Edits while playing are picked up live on the next step.
 */
export function usePlayer(code: string, options: PlayerOptions = {}) {
  const { bpm = DEFAULT_BPM, volume = 0.9, laneGains } = options;
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const parsed = useMemo(() => parsePattern(code), [code]);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const onFlashRef = useRef(options.onFlash);
  onFlashRef.current = options.onFlash;

  useEffect(() => {
    if (playingRef.current) audioEngine.updatePattern(parsed.lanes);
  }, [parsed]);

  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    audioEngine.setLaneGains(laneGains ?? []);
  }, [laneGains]);

  // Warm the sample cache while the user is still reading/typing,
  // so the first Play sounds real from step one.
  useEffect(() => {
    const t = window.setTimeout(() => void audioEngine.preload(parsed.lanes), 300);
    return () => window.clearTimeout(t);
  }, [parsed]);

  // Stop cleanly when the view unmounts (tab switch).
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  const play = () => {
    void audioEngine.play(parsed.lanes, setStep, (from, to) => onFlashRef.current?.(from, to));
    setPlaying(true);
  };

  const stop = () => {
    audioEngine.stop();
    setPlaying(false);
    setStep(-1);
  };

  return { playing, step, parsed, play, stop };
}
