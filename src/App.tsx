import { useState } from "react";
import TopNav, { type Tab } from "./components/TopNav";
import EditorView, { DEFAULT_CODE } from "./components/EditorView";
import LearnView from "./components/LearnView";
import LibraryView from "./components/LibraryView";
import { sharedFromHash } from "./lib/share";
import { DEFAULT_BPM } from "./lib/audioEngine";
import { HERO_CODE } from "./lib/gallery";

const VISITED_KEY = "bombocaja.visited";

// A shared pattern in the URL (#p=…) opens directly in the editor, at its tempo.
const SHARED = typeof location !== "undefined" ? sharedFromHash() : null;

export default function App() {
  const [hero, setHero] = useState(() => !localStorage.getItem(VISITED_KEY) && SHARED === null);
  const [editorCode, setEditorCode] = useState<string>(
    () => SHARED?.code ?? (localStorage.getItem(VISITED_KEY) ? DEFAULT_CODE : HERO_CODE)
  );
  const [tab, setTab] = useState<Tab>("editor");
  const [bpm, setBpm] = useState(SHARED?.bpm ?? DEFAULT_BPM);

  const heroDone = () => {
    setHero(false);
    localStorage.setItem(VISITED_KEY, "1");
  };

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
            hero={hero}
            onHeroDone={heroDone}
          />
        )}
        {tab === "learn" && <LearnView />}
        {tab === "library" && <LibraryView onLoad={openInEditor} />}
      </main>
    </div>
  );
}
