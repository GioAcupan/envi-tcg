import { useRef } from 'react';
import type { CardInstance, GameState } from '../../engine';
import { attachmentsOf, CardFace, defOf, isSideways, statusLabel } from '../common/Card';

export type Mark = 'source' | 'target' | 'dim' | undefined;

const LONG_PRESS_MS = 450;

/** One tappable card slot on the board or in the hand. Tap calls onTap; long-press (touch), right-click
 *  and the context-menu key call onInspect. Attached cards peek out behind the slot's top-right edge. */
export function BoardCard({ card, state, mark, onTap, onInspect }: {
  card: CardInstance; state: GameState; mark?: Mark; onTap: () => void; onInspect: () => void;
}) {
  const timer = useRef<number>();
  const pressed = useRef(false); // a long-press already handled this touch
  const touch = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const clear = () => window.clearTimeout(timer.current);
  const attachments = attachmentsOf(state, card.uid);
  const adaptations = attachments.filter(a => defOf(state, a).kind === 'adaptation').length;
  const def = defOf(state, card);
  const status = statusLabel(card);

  return <button
    type="button"
    className={`slot${isSideways(card) ? ' slot--side' : ''}${mark ? ` is-${mark}` : ''}`}
    data-uid={card.uid}
    aria-label={`${def.name}${status ? `, ${status.toLowerCase()}` : ''}${attachments.length ? `, ${attachments.length} attached` : ''}`}
    onPointerDown={e => {
      pressed.current = false;
      touch.current = e.pointerType !== 'mouse';
      if (!touch.current) return;
      origin.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = window.setTimeout(() => { pressed.current = true; navigator.vibrate?.(10); onInspect(); }, LONG_PRESS_MS);
    }}
    onPointerMove={e => { if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10) clear(); }}
    onPointerUp={clear}
    onPointerCancel={clear}
    onPointerLeave={clear}
    onContextMenu={e => {
      // Touch browsers fire contextmenu on long-press; swallow the click that may follow it.
      e.preventDefault(); clear();
      if (!pressed.current) onInspect();
      pressed.current = touch.current;
    }}
    onClick={() => { if (pressed.current) { pressed.current = false; return; } onTap(); }}
  >
    {attachments.slice(0, 3).map((a, i) =>
      <span key={a.uid} className={`slot__peek slot__peek--${defOf(state, a).kind}`} style={{ '--i': attachments.slice(0, 3).length - i } as React.CSSProperties} aria-hidden="true" />)}
    <CardFace card={card} state={state} />
    {attachments.length > 0 && <span className="slot__badge" aria-hidden="true">
      {adaptations > 0 && <span>⭐{adaptations}</span>}
      {attachments.length - adaptations > 0 && <span>+{attachments.length - adaptations}</span>}
    </span>}
  </button>;
}
