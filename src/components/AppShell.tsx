import {
  Activity,
  BarChart3,
  BookOpen,
  Database,
  Download,
  Home,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDataset } from "../app/DatasetContext";
import type { PageId } from "../app/pageTypes";
import { pageLabels } from "../app/pageTypes";
import { Button } from "./Button";

const navigation: Array<{ id: PageId; icon: typeof Home; section: string }> = [
  { id: "overview", icon: Home, section: "WORKSPACE" },
  { id: "annotate", icon: MessageSquareText, section: "WORKSPACE" },
  { id: "dataset", icon: Database, section: "WORKSPACE" },
  { id: "analysis", icon: BarChart3, section: "INSIGHTS" },
  { id: "guidelines", icon: BookOpen, section: "INSIGHTS" },
];

interface AppShellProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  isDemo: boolean;
  onExport: () => void;
  children: ReactNode;
}

export function AppShell({ page, onNavigate, isDemo, onExport, children }: AppShellProps) {
  const { saveError, clearSaveError } = useDataset();
  const sections = ["WORKSPACE", "INSIGHTS"] as const;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          aria-label="PressureTest home"
          onClick={() => onNavigate("overview")}
          type="button"
        >
          <span className="brand__mark">
            <Activity size={18} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="brand__wordmark">
            pressure<span>test</span>
          </span>
          <span className="brand__version">BETA</span>
        </button>

        <div className="workspace-switcher">
          <span className="workspace-switcher__avatar">P</span>
          <span className="workspace-switcher__copy">
            <strong>Research workspace</strong>
            <small>Personal study</small>
          </span>
          <span className="workspace-switcher__chevron" aria-hidden="true">
            ⌄
          </span>
        </div>

        <nav aria-label="Primary navigation" className="sidebar-nav">
          {sections.map((section) => (
            <div className="sidebar-nav__section" key={section}>
              <p className="sidebar-nav__label">{section}</p>
              {navigation
                .filter((item) => item.section === section)
                .map(({ id, icon: Icon }) => (
                  <button
                    aria-current={page === id ? "page" : undefined}
                    className={`nav-item${page === id ? " nav-item--active" : ""}`}
                    key={id}
                    onClick={() => onNavigate(id)}
                    type="button"
                  >
                    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                    <span>{pageLabels[id]}</span>
                    {id === "annotate" ? (
                      <span className="nav-item__dot" aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="privacy-card">
            <span className="privacy-card__icon">
              <ShieldCheck size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Private by default</strong>
              <span>Your data stays in this browser.</span>
            </div>
          </div>
          <div className="sidebar-user">
            <span className="sidebar-user__avatar">R</span>
            <span>
              <strong>Researcher</strong>
              <small>Single researcher</small>
            </span>
            <span className="sidebar-user__menu" aria-hidden="true">
              ···
            </span>
          </div>
        </div>
      </aside>

      <div className="main-column" id="top">
        <header className="topbar">
          <div className="topbar__crumbs">
            <span>PressureTest</span>
            <span className="topbar__slash">/</span>
            <strong>{pageLabels[page]}</strong>
            {isDemo ? <span className="demo-pill">SYNTHETIC SAMPLE</span> : null}
          </div>
          <div className="topbar__actions">
            <span className="saved-indicator">
              <Database size={15} aria-hidden="true" />
              <span>Local workspace</span>
            </span>
            <Button
              variant="secondary"
              size="small"
              icon={<Download size={15} />}
              onClick={onExport}
            >
              Export backup
            </Button>
          </div>
        </header>

        {saveError ? (
          <div className="save-alert" role="alert">
            <div>
              <strong>Couldn’t save this change.</strong>
              <span>{saveError}</span>
            </div>
            <button className="save-alert__dismiss" onClick={clearSaveError} type="button">
              Dismiss
            </button>
          </div>
        ) : null}

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
