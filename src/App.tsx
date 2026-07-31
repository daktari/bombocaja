import { useEffect, useState } from "react";
import TopNav, { type Tab } from "./components/TopNav";
import EditorView, { DEFAULT_CODE } from "./components/EditorView";
import LearnView from "./components/LearnView";
import LibraryView from "./components/LibraryView";
import FmView from "./components/FmView";
import IaView from "./components/IaView";
import { momentFromHash, sessionFromHash, sharedFromHash } from "./lib/share";
import { DEFAULT_BPM } from "./lib/audioEngine";
import { HERO_CODE } from "./lib/gallery";

const VISITED_KEY = "bakaluti.visited";

// A shared pattern in the URL (#p=…) opens directly in the editor, at its tempo.
const SHARED = typeof location !== "undefined" ? sharedFromHash() : null;
// A shared FM moment (#fm=…&t=…) opens the station in replay mode.
const MOMENT = typeof location !== "undefined" ? momentFromHash() : null;
// A shared IA session (#s=…) opens the IA tab with the whole lineage loaded.
const SESSION = typeof location !== "undefined" ? sessionFromHash() : null;

export default function App() {
  // First visit lands straight in the editor with the welcome pattern loaded.
  const [editorCode, setEditorCode] = useState<string>(
    () => SHARED?.code ?? (localStorage.getItem(VISITED_KEY) ? DEFAULT_CODE : HERO_CODE)
  );
  const [tab, setTab] = useState<Tab>(MOMENT ? "fm" : SESSION ? "ia" : "editor");
  const [bpm, setBpm] = useState(SHARED?.bpm ?? DEFAULT_BPM);
  const [moment, setMoment] = useState(MOMENT);
  /** a track the radio sends over for the IA to remix */
  const [iaSeed, setIaSeed] = useState<{ code: string; bpm: number; title: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(VISITED_KEY, "1");
  }, []);

  const openInEditor = (code: string, patternBpm?: number) => {
    setEditorCode(code);
    setBpm(patternBpm ?? DEFAULT_BPM);
    setTab("editor");
  };

  return (
    <div className="app-shell flex flex-col overflow-hidden">
      <TopNav tab={tab} onChange={setTab} />
      <main className="flex-1 flex min-h-0">
        {tab === "editor" && (
          <EditorView
            code={editorCode}
            onCodeChange={setEditorCode}
            bpm={bpm}
            onBpmChange={setBpm}
          />
        )}
        {tab === "fm" && (
          <FmView
            onRemix={openInEditor}
            onIaRemix={(code, trackBpm, title) => {
              setIaSeed({ code, bpm: trackBpm, title });
              setTab("ia");
            }}
            moment={moment}
            onClearMoment={() => setMoment(null)}
          />
        )}
        {tab === "ia" && (
          <IaView
            onOpen={openInEditor}
            seed={iaSeed}
            onSeedConsumed={() => setIaSeed(null)}
            session={SESSION}
          />
        )}
        {tab === "learn" && <LearnView />}
        {tab === "library" && <LibraryView onLoad={openInEditor} />}
      </main>
    </div>
  );
}
