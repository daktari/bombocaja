import { Component, type ReactNode } from "react";
import { t } from "../lib/i18n";

interface State {
  hasError: boolean;
}

/** Friendly last line of defense — the show must go on after a reload. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="app-shell flex items-center justify-center bg-ink">
        <div className="text-center space-y-5 max-w-sm px-6">
          <div className="text-lg tracking-widest select-none uppercase">
            <span className="text-fog">[</span>
            <span className="text-acid">baka</span>
            <span className="text-mag">luti</span>
            <span className="text-fog">]</span>
          </div>
          <h1 className="text-xl text-slate-100 uppercase tracking-wide">{t("err.title")}</h1>
          <p className="text-xs text-fog leading-relaxed">{t("err.body")}</p>
          <button
            onClick={() => location.reload()}
            className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-black bg-acid shadow-[4px_4px_0_#ff3ea5] hover:shadow-[2px_2px_0_#ff3ea5] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {t("err.reload")}
          </button>
        </div>
      </div>
    );
  }
}
