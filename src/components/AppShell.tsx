import {
  BarChart3,
  BookOpen,
  Database,
  Download,
  Home,
  Menu,
  MessageSquareText,
  Scale,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useDataset } from "../app/DatasetContext";
import { legalTabLabels, pageLabels, type LegalTabId, type PageId } from "../app/pageTypes";
import { BrandMark } from "./BrandMark";
import { Button } from "./Button";

const navigation: Array<{ id: PageId; icon: typeof Home; group: string }> = [
  { id: "overview", icon: Home, group: "Workspace" },
  { id: "annotate", icon: MessageSquareText, group: "Workspace" },
  { id: "dataset", icon: Database, group: "Workspace" },
  { id: "analysis", icon: BarChart3, group: "Research" },
  { id: "guidelines", icon: BookOpen, group: "Research" },
  { id: "legal", icon: Scale, group: "Compliance" },
];

interface AppShellProps {
  page: PageId;
  legalTab: LegalTabId;
  onNavigate: (page: PageId) => void;
  onOpenLegal: (tab: LegalTabId) => void;
  onOpenConsentBanner: () => void;
  isDemo: boolean;
  pendingCount: number;
  onExport: () => void;
  banner?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  page,
  legalTab,
  onNavigate,
  onOpenLegal,
  onOpenConsentBanner,
  isDemo,
  pendingCount,
  onExport,
  banner,
  children,
}: AppShellProps) {
  const { saveError, clearSaveError } = useDataset();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const groups = ["Workspace", "Research", "Compliance"] as const;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const handleSelectNav = (id: PageId) => {
    setDrawerOpen(false);
    onNavigate(id);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {drawerOpen ? (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      ) : null}

      <aside
        id="primary-sidebar"
        className={`sidebar${drawerOpen ? " sidebar--open" : ""}`}
        aria-label="Workspace sidebar"
      >
        <div className="sidebar__header">
          <button className="brand" onClick={() => handleSelectNav("overview")} type="button">
            <BrandMark size={20} />
            <span className="brand__wordmark">PressureTest</span>
          </button>
          <button
            className="mobile-drawer-close"
            onClick={() => setDrawerOpen(false)}
            type="button"
            aria-label="Close navigation menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="workspace-scope">
          <strong>Local workspace</strong>
          <span>
            {pendingCount === 0
              ? "All cases reviewed"
              : `${pendingCount} ${pendingCount === 1 ? "case" : "cases"} awaiting review`}
          </span>
        </div>

        <nav aria-label="Primary navigation" className="sidebar-nav">
          {groups.map((group) => (
            <div className="sidebar-nav__section" key={group}>
              <p className="sidebar-nav__label">{group}</p>
              {navigation
                .filter((item) => item.group === group)
                .map(({ id, icon: Icon }) => (
                  <button
                    aria-current={page === id ? "page" : undefined}
                    className={`nav-item${page === id ? " nav-item--active" : ""}`}
                    key={id}
                    onClick={() => handleSelectNav(id)}
                    type="button"
                  >
                    <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
                    <span>{pageLabels[id]}</span>
                  </button>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer__status">Browser-only storage · No cloud sync</p>
          <p className="sidebar-footer__meta">MIT · Sehaan Ur Rahman</p>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar__left">
            <button
              className="menu-button"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-controls="primary-sidebar"
              type="button"
            >
              <Menu size={16} aria-hidden="true" />
              <span>Menu</span>
            </button>
            <nav aria-label="Breadcrumb" className="topbar__crumbs">
              <span className="topbar__wordmark">PressureTest</span>
              <span className="topbar__slash" aria-hidden="true">
                /
              </span>
              <strong>{page === "legal" ? legalTabLabels[legalTab] : pageLabels[page]}</strong>
              {isDemo ? <span className="sample-pill">Synthetic sample</span> : null}
            </nav>
          </div>

          <div className="topbar__actions">
            <span className="saved-indicator">Local storage only</span>
            <Button
              variant="secondary"
              size="small"
              icon={<Download size={14} />}
              onClick={onExport}
            >
              Export backup
            </Button>
          </div>
        </header>

        <div className="sheet-surface">
          {saveError ? (
            <div className="save-alert" role="alert">
              <div>
                <strong>Could not save this change.</strong>
                <span>{saveError}</span>
              </div>
              <Button variant="secondary" size="small" onClick={clearSaveError}>
                Dismiss error
              </Button>
            </div>
          ) : null}

          {banner}

          <main className="main-content" id="main-content" tabIndex={-1}>
            {children}
          </main>

          <footer className="workspace-footer">
            <div className="workspace-footer__identity">
              <strong>PressureTest</strong>
              <span>
                Open-source software (MIT) maintained by Sehaan Ur Rahman · Patna, Bihar, India ·{" "}
                <a
                  href="https://github.com/Sehaan-1/PressureTest-"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source & support on GitHub
                </a>
              </span>
            </div>
            <nav aria-label="Legal and compliance links" className="workspace-footer__links">
              <button onClick={() => onOpenLegal("privacy")} type="button">
                Privacy policy
              </button>
              <button onClick={() => onOpenLegal("terms")} type="button">
                Terms & conditions
              </button>
              <button onClick={() => onOpenLegal("cookies")} type="button">
                Cookies & storage
              </button>
              <button onClick={() => onOpenLegal("refunds")} type="button">
                Refund policy
              </button>
              <button onClick={() => onOpenLegal("accessibility")} type="button">
                Accessibility
              </button>
              <button onClick={onOpenConsentBanner} type="button">
                Storage consent
              </button>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
}
