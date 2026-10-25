import { useEffect, useRef, type ReactNode } from 'react';

/** Modal layer over a dimmed screen. Escape, a backdrop tap or the × button calls onClose.
 *  `drawer` docks it to the right edge at full height instead of centering it. */
export function Sheet({ label, onClose, drawer, children }: {
  label: string; onClose: () => void; drawer?: boolean; children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close.current(); } };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  return <div className={`sheet-backdrop${drawer ? ' sheet-backdrop--drawer' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={`sheet${drawer ? ' sheet--drawer' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
      <button ref={closeRef} type="button" className="sheet__close" aria-label="Close" onClick={onClose}>×</button>
      {children}
    </div>
  </div>;
}
