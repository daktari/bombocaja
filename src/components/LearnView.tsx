import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Transport from "./Transport";
import StepGrid from "./StepGrid";
import CodeEditor from "./CodeEditor";
import VoicePanel from "./VoicePanel";
import { usePlayer } from "../lib/usePlayer";
import { getLessons } from "../lib/lessons";
import { t } from "../lib/i18n";

const LESSONS = getLessons();
import { loadProgress, saveProgress } from "../lib/storage";
import Rich from "./Rich";

export default function LearnView() {
  const [progress, setProgress] = useState<string[]>(loadProgress);
  const [lessonId, setLessonId] = useState<string>(() => {
    const done = loadProgress();
    return (LESSONS.find((l) => !done.includes(l.id)) ?? LESSONS[0]).id;
  });
  const lessonIndex = Math.max(0, LESSONS.findIndex((l) => l.id === lessonId));
  const lesson = LESSONS[lessonIndex];
  const nextLesson = LESSONS[lessonIndex + 1];

  const [code, setCode] = useState(lesson.example);
  const flashFn = useRef<((from: number, to: number) => void) | null>(null);
  const registerFlash = useCallback((fn: (from: number, to: number) => void) => {
    flashFn.current = fn;
  }, []);
  const { playing, step, parsed, play, stop } = usePlayer(code, {
    onFlash: (from, to) => flashFn.current?.(from, to),
  });

  const passes = useMemo(() => lesson.check(code), [lesson, code]);
  const done = progress.includes(lesson.id);

  useEffect(() => {
    if (passes && !progress.includes(lesson.id)) {
      const next = [...progress, lesson.id];
      setProgress(next);
      saveProgress(next);
    }
  }, [passes, lesson.id, progress]);

  const openLesson = (id: string) => {
    const target = LESSONS.find((l) => l.id === id);
    if (!target) return;
    stop();
    setLessonId(id);
    setCode(target.example);
  };

  const feedback = passes
    ? { success: true, text: lesson.success }
    : code.trim() === lesson.example.trim()
      ? { success: false, text: t("ln.idle") }
      : { success: false, text: t("ln.exploring") };

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="hidden md:block w-56 border-r border-white/10 bg-panel p-3 space-y-1 overflow-y-auto shrink-0">
        <div className="flex items-baseline justify-between px-1 mb-2">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-fog">{t("ln.lessons")}</h2>
          <span className="text-[10px] led">
            {progress.filter((id) => LESSONS.some((l) => l.id === id)).length}/{LESSONS.length}
          </span>
        </div>
        {LESSONS.map((l, i) => {
          const isDone = progress.includes(l.id);
          const isActive = l.id === lessonId;
          return (
            <button
              key={l.id}
              onClick={() => openLesson(l.id)}
              className={
                "w-full text-left px-3 py-2 transition-all flex items-center gap-3 " +
                (isActive
                  ? "bg-acid/10 text-acid border-l-2 border-acid"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent")
              }
            >
              <span
                className={
                  "text-[10px] tabular-nums " + (isActive ? "text-acid" : "text-fog/70")
                }
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xs flex-1 truncate">{l.title}</span>
              {isDone && <span className="text-[10px] text-acid">✓</span>}
            </button>
          );
        })}
      </aside>

      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {/* Mobile lesson strip */}
          <div className="md:hidden flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
            {LESSONS.map((l, i) => {
              const isDone = progress.includes(l.id);
              const isActive = l.id === lessonId;
              return (
                <button
                  key={l.id}
                  onClick={() => openLesson(l.id)}
                  className={
                    "shrink-0 px-2.5 py-1.5 text-[11px] tabular-nums border transition-all " +
                    (isActive
                      ? "bg-acid text-black border-acid font-bold"
                      : isDone
                        ? "text-acid border-acid/40"
                        : "text-fog border-white/15")
                  }
                >
                  {String(i + 1).padStart(2, "0")}
                  {isDone && !isActive ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <header>
            <div className="text-[10px] uppercase tracking-[0.3em] text-mag/80 mb-1">
              {t("ln.lesson")} {String(lessonIndex + 1).padStart(2, "0")}/{String(LESSONS.length).padStart(2, "0")}{" "}
              {done && <span className="text-acid">{t("ln.done")}</span>}
            </div>
            <h1 className="text-2xl text-slate-100 uppercase tracking-wide">{lesson.title}</h1>
          </header>

          <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
            {lesson.intro.map((block, i) =>
              typeof block === "string" ? (
                <p key={i}>
                  <Rich text={block} />
                </p>
              ) : (
                <pre
                  key={i}
                  className="bg-black border border-white/10 px-4 py-3 text-acid overflow-x-auto"
                >
                  {block.code}
                </pre>
              )
            )}
          </section>

          <section className="border border-acid/25 bg-panel p-5 space-y-4 shadow-[5px_5px_0_rgba(200,255,0,0.12)]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-fog">{t("ln.try")}</h2>
              <Transport
                playing={playing}
                onPlay={play}
                onStop={stop}
                onReset={() => setCode(lesson.example)}
              />
            </div>

            {lesson.id === "voz" && <VoicePanel />}

            <CodeEditor
              value={code}
              onChange={setCode}
              onPlay={play}
              onStop={stop}
              registerFlash={registerFlash}
              className="w-full h-24 overflow-hidden bg-black/70 border border-acid/25 focus-within:border-acid/60 transition-all"
            />

            <StepGrid lanes={parsed.lanes} step={step} />

            <div className="border border-mag/40 bg-mag/5 px-4 py-3 text-sm">
              <span className="text-mag font-bold uppercase">{t("ln.task")}</span>{" "}
              <span className="text-slate-300">
                <Rich text={lesson.task} />
              </span>
            </div>

            <div
              className={
                "border px-4 py-3 text-sm leading-relaxed transition-all " +
                (feedback.success
                  ? "border-acid/60 bg-acid/10 text-slate-100 shadow-[3px_3px_0_rgba(200,255,0,0.2)]"
                  : "border-white/10 text-slate-400")
              }
            >
              <Rich text={feedback.text} />
            </div>

            {(passes || done) && nextLesson && (
              <button
                onClick={() => openLesson(nextLesson.id)}
                className="w-full px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-acid border border-acid hover:bg-acid hover:text-black transition-all"
              >
                {t("ln.next")} {String(lessonIndex + 2).padStart(2, "0")} · {nextLesson.title} →
              </button>
            )}
          </section>

          <p className="text-xs text-fog/70 text-center pb-4">{t("ln.footer")}</p>
        </div>
      </div>
    </div>
  );
}
