import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { legalTabLabels, legalTabs, type LegalTabId } from "../../app/pageTypes";
import type { ConsentRecord, ConsentLevel } from "../../storage/consentRepository";

interface LegalPageProps {
  activeTab: LegalTabId;
  onChangeTab: (tab: LegalTabId) => void;
  consent: ConsentRecord | null;
  onUpdateConsent: (level: ConsentLevel) => void;
  storageBytes: number;
  exampleCount: number;
  onExportJson: () => void;
  onClearBrowserData: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function LegalPage({
  activeTab,
  onChangeTab,
  consent,
  onUpdateConsent,
  storageBytes,
  exampleCount,
  onExportJson,
  onClearBrowserData,
}: LegalPageProps) {
  return (
    <div className="legal-page">
      <PageHeader
        title="Policies, legal terms, and compliance"
        description="Plain-language disclosures for privacy, terms of use, browser storage, accessibility conformance, and applicable data laws."
        actions={
          <Button variant="secondary" onClick={onExportJson}>
            Export workspace JSON
          </Button>
        }
      />

      <div className="legal-tabs" role="tablist" aria-label="Legal and compliance documents">
        {legalTabs.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`panel-${tab}`}
            className={`legal-tab${activeTab === tab ? " legal-tab--active" : ""}`}
            onClick={() => onChangeTab(tab)}
            type="button"
          >
            {legalTabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === "privacy" ? (
        <div
          id="panel-privacy"
          role="tabpanel"
          aria-labelledby="tab-privacy"
          className="settings-list"
        >
          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Project & maintainer details</h2>
              <p>
                Verified authorship, source repository, and data protection contact details for
                PressureTest.
              </p>
            </div>
            <div className="settings-panel">
              <dl className="kv-list">
                <div className="kv-row">
                  <dt>Project name</dt>
                  <dd>PressureTest (Open-source research workbench, v0.1.0)</dd>
                </div>
                <div className="kv-row">
                  <dt>Author & maintainer</dt>
                  <dd>Sehaan Ur Rahman (@Sehaan-1)</dd>
                </div>
                <div className="kv-row">
                  <dt>Operating base</dt>
                  <dd>Patna, Bihar, India</dd>
                </div>
                <div className="kv-row">
                  <dt>License</dt>
                  <dd>MIT License (free and open-source software)</dd>
                </div>
                <div className="kv-row">
                  <dt>Support & privacy requests</dt>
                  <dd>
                    <a
                      href="https://github.com/Sehaan-1/PressureTest-/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-policy-link"
                    >
                      github.com/Sehaan-1/PressureTest-/issues
                    </a>
                  </dd>
                </div>
                <div className="kv-row">
                  <dt>Last updated</dt>
                  <dd>2026-10-21</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Zero server collection & data minimization</h2>
              <p>
                PressureTest operates without user accounts, backend databases, analytics pixels, or
                outbound API requests.
              </p>
            </div>
            <div className="settings-panel settings-prose">
              <p>
                <strong>What is stored:</strong> Only the research conversations, annotations, and
                storage consent choice you enter or import into this browser profile.
              </p>
              <p>
                <strong>What is never collected:</strong> PressureTest never collects names, email
                addresses, payment details, IP logs, device fingerprints, behavioural telemetry, or
                third-party tracking cookies.
              </p>
              <p>
                <strong>Necessary data rule:</strong> Do not paste personal data (PII), confidential
                records, or provider API keys into conversation fields. Client-side checks warn
                before saving if pasted text resembles an email address or secret token.
              </p>
            </div>
          </section>

          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Your privacy rights</h2>
              <p>
                Immediate local access, correction, portability, and permanent erasure without
                waiting on a request ticket.
              </p>
            </div>
            <div className="settings-panel settings-prose">
              <p>
                Because every record resides exclusively in your browser storage, you can inspect
                all data on the <strong>Dataset</strong> screen, export portable JSON or CSV files
                at any time, edit or delete individual conversations immediately, or wipe all local
                storage under the <strong>Cookies & storage</strong> tab.
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "terms" ? (
        <div id="panel-terms" role="tabpanel" aria-labelledby="tab-terms" className="settings-list">
          <section className="settings-row">
            <div className="settings-row__info">
              <h2>License & permitted use</h2>
              <p>Terms governing use, modification, and redistribution of the software.</p>
            </div>
            <div className="settings-panel settings-prose">
              <p>
                PressureTest is provided free of charge under the <strong>MIT License</strong>{" "}
                (Copyright 2026 Sehaan Ur Rahman). You may use, copy, modify, merge, publish, and
                distribute the software subject to preserving the copyright and permission notice.
              </p>
              <p>
                Typography assets (IBM Plex Sans and IBM Plex Mono) are self-hosted under the{" "}
                <strong>SIL Open Font License 1.1 (OFL-1.1)</strong>. UI icons from Lucide are
                licensed under the <strong>ISC License</strong>.
              </p>
            </div>
          </section>

          <section className="settings-row">
            <div className="settings-row__info">
              <h2>No unsupported claims & synthetic sample notice</h2>
              <p>Boundaries on what this tool measures and how starter data may be cited.</p>
            </div>
            <div className="settings-panel settings-prose">
              <p>
                <strong>Synthetic starter examples:</strong> The eight starter rows (
                <code className="mono-id">PT-DEMO-001</code> through{" "}
                <code className="mono-id">PT-DEMO-008</code>) are hand-authored synthetic
                illustrations created solely to demonstrate the annotation workflow. Never cite or
                publish them as empirical model evaluation results.
              </p>
              <p>
                <strong>Descriptive counts only:</strong> Rates and bar comparisons summarize your
                labeled rows only. They do not establish causal effects, inter-annotator agreement,
                statistical significance, or population-level model safety.
              </p>
            </div>
          </section>

          <section className="settings-row">
            <div className="settings-row__info">
              <h2>User responsibility & warranty disclaimer</h2>
              <p>Your obligations when importing transcripts and statutory liability limits.</p>
            </div>
            <div className="settings-panel settings-prose">
              <p>
                You are responsible for ensuring you have lawful permission and consent to process
                any transcripts you import, and for keeping regular JSON backups of your browser
                workspace. As stated in the MIT License, the software is provided "as is", without
                warranty of any kind, to the maximum extent permitted by applicable law.
              </p>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "cookies" ? (
        <div
          id="panel-cookies"
          role="tabpanel"
          aria-labelledby="tab-cookies"
          className="settings-list"
        >
          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Cookies & local storage inventory</h2>
              <p>
                Exact browser storage keys currently active on this device (
                {formatBytes(storageBytes)} across {exampleCount.toLocaleString()} stored
                conversations).
              </p>
            </div>
            <div className="settings-panel">
              <table className="policy-table">
                <thead>
                  <tr>
                    <th scope="col">Key</th>
                    <th scope="col">Purpose</th>
                    <th scope="col">Category</th>
                    <th scope="col">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td data-label="Key">
                      <code className="mono-id">pressuretest.dataset.v1</code>
                    </td>
                    <td data-label="Purpose">Stores conversations and human annotations locally</td>
                    <td data-label="Category">Strictly necessary</td>
                    <td data-label="Retention">Until deleted</td>
                  </tr>
                  <tr>
                    <td data-label="Key">
                      <code className="mono-id">pressuretest.consent.v1</code>
                    </td>
                    <td data-label="Purpose">Records your storage preference selection</td>
                    <td data-label="Category">Preference record</td>
                    <td data-label="Retention">Until cleared</td>
                  </tr>
                  <tr>
                    <td data-label="Key">HTTP cookies</td>
                    <td data-label="Purpose">None set by PressureTest</td>
                    <td data-label="Category">None (0 cookies)</td>
                    <td data-label="Retention">Not applicable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Consent preference</h2>
              <p>
                Current status:{" "}
                <strong>
                  {consent
                    ? consent.level === "preferences_allowed"
                      ? "UI preferences enabled"
                      : "Essential storage only"
                    : "Essential storage active (awaiting explicit choice)"}
                </strong>
              </p>
            </div>
            <div className="settings-panel settings-actions-panel">
              <p>
                Switch between strictly necessary dataset storage only and allowing optional local
                filter preferences at any time.
              </p>
              <div className="button-row">
                <Button
                  variant={consent?.level === "essential_only" ? "primary" : "secondary"}
                  onClick={() => onUpdateConsent("essential_only")}
                >
                  Essential storage only
                </Button>
                <Button
                  variant={consent?.level === "preferences_allowed" ? "primary" : "secondary"}
                  onClick={() => onUpdateConsent("preferences_allowed")}
                >
                  Allow UI preferences
                </Button>
              </div>
            </div>
          </section>

          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Erase local browser data</h2>
              <p>
                Permanently remove all saved conversations, annotations, and consent records from
                this browser profile.
              </p>
            </div>
            <div className="settings-panel settings-actions-panel">
              <p>Export a JSON backup first if you want to keep your current annotations.</p>
              <div className="button-row">
                <Button variant="danger" onClick={onClearBrowserData}>
                  Erase all local data
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "accessibility" ? (
        <div
          id="panel-accessibility"
          role="tabpanel"
          aria-labelledby="tab-accessibility"
          className="settings-list"
        >
          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Accessibility statement (WCAG 2.1 AA)</h2>
              <p>
                Contrast ratios, keyboard operation, screen-reader semantics, and third-party
                isolation verified directly against rendered screens.
              </p>
            </div>
            <div className="settings-panel settings-prose">
              <p>
                <strong>Visual contrast & typography:</strong> Text and interactive labels maintain
                at least a 4.5:1 contrast ratio on light surfaces, with minimum 12px type for
                secondary metadata and 14px body text in self-hosted IBM Plex Sans.
              </p>
              <p>
                <strong>Keyboard & assistive technology:</strong> Every control is operable via
                keyboard with a high-contrast focus ring, skip-to-content navigation, explicit form
                labels, accessible SVG chart descriptions, <code className="mono-id">Escape</code>{" "}
                dialog dismissal with focus restoration, and{" "}
                <code className="mono-id">Ctrl/Cmd + Enter</code> annotation saving.
              </p>
              <p>
                <strong>Third-party embed isolation:</strong> Content-Security-Policy headers block
                external frames, remote scripts, and font CDNs so third-party embeds cannot degrade
                accessibility or leak visitor metadata.
              </p>
            </div>
          </section>

          <section className="settings-row">
            <div className="settings-row__info">
              <h2>Local & international data laws</h2>
              <p>Jurisdictional compliance summary for India, the EU/EEA, the UK, and the US.</p>
            </div>
            <div className="settings-panel settings-prose">
              <p>
                <strong>India (DPDP Act, 2023 & IT Act, 2000):</strong> Maintained in Patna, Bihar,
                India. Because PressureTest collects zero personal data onto any server, it does not
                act as a remote Data Fiduciary over your files; when importing third-party prompts,
                ensure notice, consent, and data minimization compliance.
              </p>
              <p>
                <strong>EU/EEA & UK (GDPR, ePrivacy Directive, PECR):</strong> Self-hosting WOFF2
                fonts eliminates cross-border Google Fonts IP transfers. Essential workspace storage
                follows Art. 5(3) strictly-necessary storage rules, while optional preferences
                require explicit opt-in.
              </p>
              <p>
                <strong>United States (CCPA/CPRA):</strong> Zero personal information is sold,
                shared, or transmitted across devices or advertising networks.
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
