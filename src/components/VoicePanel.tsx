import { useEffect, useState } from "react";
import { voiceBank, VOICE_SLOTS } from "../lib/voiceBank";
import { audioEngine } from "../lib/audioEngine";
import { t } from "../lib/i18n";

/**
 * Eight mic-recording slots. Recording slot N makes the token vN playable
 * in any pattern. Recordings persist in the browser (IndexedDB).
 */
export default function VoicePanel() {
  const [slots, setSlots] = useState<boolean[]>(() => Array(VOICE_SLOTS).fill(false));
  const [recording, setRecording] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void voiceBank.loadBlobs().then(() => setSlots(voiceBank.slotStates()));
  }, []);

  const record = async (slot: number) => {
    if (recording !== null) return;
    setRecording(slot);
    try {
      await voiceBank.record(slot, audioEngine.getAudioContext());
      setSlots(voiceBank.slotStates());
    } catch {
      setError(true);
      window.setTimeout(() => setError(false), 2500);
    } finally {
      setRecording(null);
    }
  };

  const remove = (slot: number) => {
    voiceBank.remove(slot);
    setSlots(voiceBank.slotStates());
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs">
      <span className="text-[10px] uppercase tracking-widest text-fog mr-1">
        {t("vox.label")}
      </span>
      {slots.map((has, i) => {
        const slot = i + 1;
        if (recording === slot) {
          return (
            <span key={slot} className="px-2 py-1 border border-red-500 text-red-400 blink">
              ● v{slot}
            </span>
          );
        }
        if (has) {
          return (
            <span key={slot} className="flex items-stretch">
              <button
                onClick={() => void voiceBank.preview(slot, audioEngine.getAudioContext())}
                title={t("vox.playTitle")}
                className="px-2 py-1 border border-mag/60 text-mag hover:bg-mag hover:text-black transition-all"
              >
                v{slot} ▶
              </button>
              <button
                onClick={() => remove(slot)}
                title={t("vox.delTitle")}
                className="px-1.5 py-1 border border-l-0 border-mag/30 text-fog hover:text-red-400 transition-all"
              >
                ✕
              </button>
            </span>
          );
        }
        return (
          <button
            key={slot}
            onClick={() => void record(slot)}
            title={t("vox.recTitle")}
            className="px-2 py-1 border border-white/15 text-fog/70 hover:border-red-500/60 hover:text-red-400 transition-all"
          >
            v{slot} ●
          </button>
        );
      })}
      <span className="text-[10px] text-fog/60 ml-1">
        {error ? <span className="text-warn">{t("vox.err")}</span> : t("vox.hint")}
      </span>
    </div>
  );
}
