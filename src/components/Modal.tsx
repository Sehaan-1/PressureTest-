import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "medium" | "large";
}

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Modal({ title, description, onClose, children, size = "medium" }: ModalProps) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    return () => previous?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="modal-backdrop">
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className={`modal-panel modal-panel--${size}`}
        onKeyDown={handleKeyDown}
        ref={panelRef}
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
