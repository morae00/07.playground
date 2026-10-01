import { useEffect, useRef, useState, type ReactNode } from 'react';

type ModalDialogProps = {
  className: string;
  labelledBy: string;
  describedBy?: string;
  onEscape?: () => void;
  /**
   * Milliseconds after opening during which activation input (clicks, Enter, Space, digits) is ignored.
   * Prevents a key or click meant for the game from choosing a reward the player never saw (BUG-05).
   */
  inputGuardMs?: number;
  children: ReactNode;
};

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// R redraws a draft under the SYS-08 experiment, so it waits out the guard like a pick.
const ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'r', 'R']);

export function ModalDialog({ className, labelledBy, describedBy, onEscape, inputGuardMs = 0, children }: ModalDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const escapeRef = useRef(onEscape);
  const [guarded, setGuarded] = useState(inputGuardMs > 0);
  escapeRef.current = onEscape;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    // Focus the dialog itself, not its first button, so an in-flight Enter/Space cannot activate anything.
    dialog.focus();

    const layer = dialog.parentElement;
    const inertSiblings: Element[] = [];
    for (const sibling of Array.from(layer?.parentElement?.children ?? [])) {
      if (sibling === layer || sibling.hasAttribute('inert')) continue;
      sibling.setAttribute('inert', '');
      inertSiblings.push(sibling);
    }

    const openedAt = performance.now();
    const guardActive = () => inputGuardMs > 0 && performance.now() - openedAt < inputGuardMs;
    const guardTimer = inputGuardMs > 0 ? window.setTimeout(() => setGuarded(false), inputGuardMs) : undefined;

    const blockActivation = (event: KeyboardEvent) => {
      if (!ACTIVATION_KEYS.has(event.key)) return;
      if (event.repeat || guardActive()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const blockClick = (event: MouseEvent) => {
      if (!guardActive() || !(event.target instanceof Node) || !dialog.contains(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && escapeRef.current) {
        event.preventDefault();
        escapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', blockActivation, true);
    window.addEventListener('keyup', blockActivation, true);
    window.addEventListener('click', blockClick, true);
    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(guardTimer);
      window.removeEventListener('keydown', blockActivation, true);
      window.removeEventListener('keyup', blockActivation, true);
      window.removeEventListener('click', blockClick, true);
      dialog.removeEventListener('keydown', onKeyDown);
      for (const sibling of inertSiblings) sibling.removeAttribute('inert');
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [inputGuardMs]);

  return (
    <div className="modalLayer">
      <section
        ref={dialogRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        data-input-guard={guarded ? 'on' : 'off'}
        tabIndex={-1}
      >
        {inputGuardMs > 0 && (
          <div
            className={guarded ? 'inputGuard active' : 'inputGuard'}
            style={{ animationDuration: `${inputGuardMs}ms` }}
            aria-hidden="true"
          />
        )}
        {children}
      </section>
    </div>
  );
}
