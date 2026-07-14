import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

// Reusable right-side slide-over drawer. Extracted from UserManagement's
// UserDetailDrawer markup, plus the accessibility the rest of the app lacks:
// role="dialog" + aria-modal, a labelled title, Escape-to-close, a focus trap,
// and focus restored to whatever element opened the drawer.
export default function Drawer({ title, subtitle, onClose, children }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;

    const focusables = () => (panel
      ? Array.from(panel.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ))
      : []);

    // Move focus into the drawer on open.
    (focusables()[0] || panel)?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const els = focusables();
        if (els.length === 0) { e.preventDefault(); return; }
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Restore focus to the element that opened the drawer.
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white h-full overflow-y-auto outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h3 id={titleId} className="text-xl font-extrabold tracking-tight">{title}</h3>
            {subtitle ? <p className="text-xs text-gray-600 mt-1">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded hover:bg-gray-100 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
