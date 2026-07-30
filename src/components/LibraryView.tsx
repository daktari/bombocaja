import { useEffect, useState } from "react";
import { deletePattern, loadPatterns } from "../lib/storage";
import { patternUrl } from "../lib/share";
import { GALLERY } from "../lib/gallery";
import { usePlayer } from "../lib/usePlayer";
import { pick, t } from "../lib/i18n";
import Rich from "./Rich";

export default function LibraryView({ onLoad }: { onLoad: (code: string, bpm?: number) => void }) {
  const [patterns, setPatterns] = useState(loadPatterns);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState("");
  const [previewBpm, setPreviewBpm] = useState<number | undefined>(undefined);
  const { play, stop } = usePlayer(previewCode, { bpm: previewBpm });

  // (Re)start the preview when a card is selected.
  useEffect(() => {
    if (previewId) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewId, previewCode]);

  const togglePreview = (id: string, code: string, bpm?: number) => {
    if (previewId === id) {
      stop();
      setPreviewId(null);
    } else {
      setPreviewCode(code);
      setPreviewBpm(bpm);
      setPreviewId(id);
    }
  };

  const remove = (id: string) => {
    deletePattern(id);
    setPatterns(loadPatterns());
  };

  const copyLink = async (id: string, code: string, bpm?: number) => {
    await navigator.clipboard.writeText(patternUrl(code, bpm));
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-10">
        <section>
          <h1 className="text-[10px] uppercase tracking-[0.3em] text-fog mb-1">
            {t("lib.remix")}
          </h1>
          <p className="text-xs text-fog/80 mb-4">{t("lib.remixSub")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GALLERY.map((g) => (
              <div
                key={g.id}
                className={
                  "border bg-panel p-4 space-y-3 transition-all " +
                  (previewId === g.id
                    ? "border-acid/70 shadow-[4px_4px_0_rgba(200,255,0,0.2)]"
                    : "border-white/10 hover:border-acid/40")
                }
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm text-slate-200 truncate">{pick(g.name)}</h2>
                  <span className="text-[10px] text-mag/80 shrink-0 uppercase tracking-wider">{pick(g.style)}</span>
                </div>
                <pre className="text-[11px] text-acid/70 bg-black border border-white/10 px-3 py-2 overflow-hidden max-h-20 leading-relaxed whitespace-pre-wrap break-words">
                  {g.code}
                </pre>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => togglePreview(g.id, g.code, g.bpm)}
                    className={
                      "px-3 py-1.5 font-bold uppercase tracking-wider border transition-all " +
                      (previewId === g.id
                        ? "text-mag border-mag hover:bg-mag hover:text-black"
                        : "text-acid border-acid/60 hover:bg-acid hover:text-black")
                    }
                  >
                    {previewId === g.id ? t("lib.stop") : t("lib.listen")}
                  </button>
                  <button
                    onClick={() => {
                      stop();
                      onLoad(g.code, g.bpm);
                    }}
                    className="px-3 py-1.5 uppercase tracking-wider text-slate-300 border border-white/15 hover:border-acid/60 hover:text-acid transition-all"
                  >
                    {t("lib.remixBtn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h1 className="text-[10px] uppercase tracking-[0.3em] text-fog mb-4">
            {t("lib.yours")} · {patterns.length}
          </h1>
          {patterns.length === 0 ? (
            <p className="text-xs text-fog/80">
              <Rich text={t("lib.empty")} />
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patterns.map((p) => (
                <div
                  key={p.id}
                  className={
                    "border bg-panel p-4 space-y-3 transition-all " +
                    (previewId === p.id
                      ? "border-acid/70 shadow-[4px_4px_0_rgba(200,255,0,0.2)]"
                      : "border-white/10 hover:border-acid/40")
                  }
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-sm text-slate-200 truncate">{p.name}</h2>
                    <span className="text-[10px] text-fog/70 shrink-0">
                      {new Date(p.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <pre className="text-[11px] text-acid/70 bg-black border border-white/10 px-3 py-2 overflow-hidden max-h-20 leading-relaxed whitespace-pre-wrap break-words">
                    {p.code}
                  </pre>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => togglePreview(p.id, p.code, p.bpm)}
                      className={
                        "px-3 py-1.5 font-bold uppercase tracking-wider border transition-all " +
                        (previewId === p.id
                          ? "text-mag border-mag hover:bg-mag hover:text-black"
                          : "text-acid border-acid/60 hover:bg-acid hover:text-black")
                      }
                    >
                      {previewId === p.id ? t("lib.stop") : t("lib.listen")}
                    </button>
                    <button
                      onClick={() => {
                        stop();
                        onLoad(p.code, p.bpm);
                      }}
                      className="px-3 py-1.5 uppercase tracking-wider text-slate-300 border border-white/15 hover:border-acid/60 hover:text-acid transition-all"
                    >
                      {t("lib.open")}
                    </button>
                    <button
                      onClick={() => void copyLink(p.id, p.code, p.bpm)}
                      aria-label={t("ed.share")}
                      className="px-3 py-1.5 uppercase tracking-wider text-slate-300 border border-white/15 hover:border-acid/60 hover:text-acid transition-all"
                    >
                      {copiedId === p.id ? "✓" : "↗"}
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      title={t("lib.delete")}
                      className="ml-auto px-3 py-1.5 text-fog border border-white/15 hover:text-red-400 hover:border-red-500/50 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
