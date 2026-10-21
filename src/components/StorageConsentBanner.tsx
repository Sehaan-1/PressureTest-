import { Button } from "./Button";
import type { ConsentLevel } from "../storage/consentRepository";

interface StorageConsentBannerProps {
  onSelect: (level: ConsentLevel) => void;
  onOpenPolicy: () => void;
}

export function StorageConsentBanner({ onSelect, onOpenPolicy }: StorageConsentBannerProps) {
  return (
    <section className="consent-banner" aria-label="Browser storage and cookie preferences">
      <div className="consent-banner__copy">
        <strong>Browser storage notice: zero tracking cookies.</strong>
        <span>
          PressureTest sets no analytics, advertising, or third-party cookies. Strictly necessary
          local browser storage saves your workspace dataset on this device. Choose whether to also
          remember optional UI view preferences.
        </span>
        <button className="inline-policy-link" onClick={onOpenPolicy} type="button">
          Read cookies & storage policy
        </button>
      </div>
      <div className="consent-banner__actions">
        <Button variant="secondary" size="small" onClick={() => onSelect("essential_only")}>
          Essential storage only
        </Button>
        <Button size="small" onClick={() => onSelect("preferences_allowed")}>
          Allow UI preferences
        </Button>
      </div>
    </section>
  );
}
