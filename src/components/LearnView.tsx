import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Transport from "./Transport";
import StepGrid from "./StepGrid";
import CodeEditor from "./CodeEditor";
import VoicePanel from "./VoicePanel";
import PlayableCode from "./PlayableCode";
import Rich from "./Rich";
import { usePlayer } from "../lib/usePlayer";
import { getLessons, getExtras, type IntroBlock, type Lesson, type Extra } from "../lib/lessons";
import { loadProgress, saveProgress } from "../lib/storage";
import { t } from "../lib/i18n";

const COURSE = getLessons();
const EXTRAS = getExtras();
const RECIPES = EXTRAS.filter((e) => e.kind === "receta");
const DEEPDIVES = EXTRAS.filter((e) => e.kind === "fondo");

const pad2 = (n: number) => String(n).padStart(2, "0");

function IntroBlocks({ blocks }: { blocks: IntroBlock[] }) {
  return (
    <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
      {blocks.map((block, i) =>
        typeof block === "string" ? (
          <p key={i}>
            <Rich text={block} />
          </p>
        ) : (
          <PlayableCode key={i} code={block.code} />
        )
      )}
    </section>
  );
}

export default function LearnView() {
  const [progress, setProgress] = useState<string[]>(loadProgress);
  const [itemId, setItemId] = useState<string>(() => {
    const done = loadProgress();
    return (COURSE.find((l) => !done.includes(l.id)) ?? COURSE[0]).id;
  });

  const lesson: Lesson | undefined = COURSE.find((l) => l.id === itemId);
  const extra: Extra | undefined = EXTRAS.find((e) => e.id === itemId);
  const item = lesson ?? extra ?? COURSE[0];
  const courseIndex = lesson ? COURSE.indexOf(lesson) : -1;
  const nextLesson = lesson ? COURSE[courseIndex + 1] : undefined;

  const [code, setCode] = useState(item.example);
  const flashFn = useRef<((from: number, to: number) => void) | null>(null);
  const registerFlash = useCallback((fn: (from: number, to: number) => void) => {
    flashFn.current = fn;
  }, []);
  const { playing, step, parsed, play, stop } = usePlayer(code, {
    onFlash: (from, to) => flashFn.current?.(from, to),
  });

  const passes = useMemo(() => (lesson ? lesson.check(code) : false), [lesson, code]);
  const done = lesson ? progress.includes(lesson.id) : false;

  useEffect(() => {
    if (lesson && passes && !progress.includes(lesson.id)) {
      const next = [...progress, lesson.id];
      setProgress(next);
      saveProgress(next);
    }
  }, [passes, lesson, progress]);

  const openItem = (id: string) => {
    const target = COURSE.find((l) => l.id === id) ?? EXTRAS.find((e) => e.id === id);
    if (!target) return;
    stop();
    setItemId(id);
    setCode(target.example);
  };

  const feedback = passes
    ? { success: true, text: lesson?.success ?? "" }
    : code.trim() === item.example.trim()
      ? { success: false, text: t("ln.idle") }
      : { success: false, text: t("ln.exploring") };

  const indexButton = (
    id: string,
    label: string,
    title: string,
    isDone: boolean,
    isActive: boolean
  ) => (
    <button
      key={id}
      onClick={() => openItem(id)}
      className={
        "w-full text-left px-3 py-2 transition-all flex items-center gap-3 " +
        (isActive
          ? "bg-acid/10 text-acid border-l-2 border-acid"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent")
      }
    >
      <span className={"text-[10px] tabular-nums " + (isActive ? "text-acid" : "text-fog/70")}>
        {label}
      </span>
      <span className="text-xs flex-1 truncate">{title}</span>
      {isDone && <span className="text-[10px] text-acid">✓</span>}
    </button>
  );

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="hidden md:block w-56 border-r border-white/10 bg-panel p-3 space-y-1 overflow-y-auto shrink-0">
        <div className="flex items-baseline justify-between px-1 mb-2">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-fog">{t("ln.course")}</h2>
          <span className="text-[10px] led">
            {progress.filter((id) => COURSE.some((l) => l.id === id)).length}/{COURSE.length}
          </span>
        </div>
        {COURSE.map((l, i) =>
          indexButton(l.id, pad2(i + 1), l.title, progress.includes(l.id), l.id === itemId)
        )}

        <h2 className="text-[10px] uppercase tracking-[0.2em] text-fog px-1 pt-4 pb-1">
          {t("ln.recipes")}
        </h2>
        {RECIPES.map((e, i) => indexButton(e.id, `r${i + 1}`, e.title, false, e.id === itemId))}

        <h2 className="text-[10px] uppercase tracking-[0.2em] text-fog px-1 pt-4 pb-1">
          {t("ln.deep")}
        </h2>
        {DEEPDIVES.map((e, i) => indexButton(e.id, `f${i + 1}`, e.title, false, e.id === itemId))}
      </aside>

      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {/* Mobile strip */}
          <div className="md:hidden flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
            {[
              ...COURSE.map((l, i) => ({ id: l.id, label: pad2(i + 1), done: progress.includes(l.id) })),
              ...RECIPES.map((e, i) => ({ id: e.id, label: `r${i + 1}`, done: false })),
              ...DEEPDIVES.map((e, i) => ({ id: e.id, label: `f${i + 1}`, done: false })),
            ].map(({ id, label, done: isDone }) => {
              const isActive = id === itemId;
              return (
                <button
                  key={id}
                  onClick={() => openItem(id)}
                  className={
                    "shrink-0 px-2.5 py-1.5 text-[11px] tabular-nums border transition-all " +
                    (isActive
                      ? "bg-acid text-black border-acid font-bold"
                      : isDone
                        ? "text-acid border-acid/40"
                        : "text-fog border-white/15")
                  }
                >
                  {label}
                  {isDone && !isActive ? " ✓" : ""}
                </button>
              );
            })}
          </div>

          <header>
            <div className="text-[10px] uppercase tracking-[0.3em] text-mag/80 mb-1">
              {lesson ? (
                <>
                  {t("ln.lesson")} {pad2(courseIndex + 1)}/{pad2(COURSE.length)}{" "}
                  {done && <span className="text-acid">{t("ln.done")}</span>}
                </>
              ) : (
                <>{extra?.kind === "receta" ? t("ln.recipe") : t("ln.deepLabel")}</>
              )}
            </div>
            <h1 className="text-2xl text-slate-100 uppercase tracking-wide">{item.title}</h1>
          </header>

          <IntroBlocks blocks={item.intro} />

          <section className="border border-acid/25 bg-panel p-5 space-y-4 shadow-[5px_5px_0_rgba(200,255,0,0.12)]">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-fog">{t("ln.try")}</h2>
              <Transport
                playing={playing}
                onPlay={play}
                onStop={stop}
                onReset={() => setCode(item.example)}
              />
            </div>

            {item.id === "voz" && <VoicePanel />}

            <CodeEditor
              value={code}
              onChange={setCode}
              onPlay={play}
              onStop={stop}
              registerFlash={registerFlash}
              className="w-full h-24 overflow-hidden bg-black/70 border border-acid/25 focus-within:border-acid/60 transition-all"
            />

            <StepGrid lanes={parsed.lanes} step={step} />

            {lesson && (
              <>
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
                    onClick={() => openItem(nextLesson.id)}
                    className="w-full px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-acid border border-acid hover:bg-acid hover:text-black transition-all"
                  >
                    {t("ln.next")} {pad2(courseIndex + 2)} · {nextLesson.title} →
                  </button>
                )}
              </>
            )}
          </section>

          <p className="text-xs text-fog/70 text-center pb-4">{t("ln.footer")}</p>
        </div>
      </div>
    </div>
  );
}
