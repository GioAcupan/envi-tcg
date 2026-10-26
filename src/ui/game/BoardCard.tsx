import { useRef } from 'react';
import type { CardInstance, GameState } from '../../engine';
import { attachmentsOf, CardFace, defOf, isInactiveOrganism, isOrganism, isSideways, nutrientText, statusLabel, workersOf } from '../common/Card';

export type Mark = 'source' | 'target' | 'dim' | undefined;

const LONG_PRESS_MS = 450;

/** A worked card remains underneath its workers; eaten prey remains underneath its consumer.
 * Each exposed card is independently tappable and inspectable, including during targeting. */
export function BoardCard({ card, state, markOf, onTap, onInspect }: {
  card: CardInstance; state: GameState; markOf: (c: CardInstance) => Mark;
  onTap: (c: CardInstance) => void; onInspect: (c: CardInstance) => void;
}) {
  const over = [...workersOf(state, card.uid), ...attachmentsOf(state, card.uid).filter(c => defOf(state, c).kind === 'microbe')];
  const under = attachmentsOf(state, card.uid).filter(c => defOf(state, c).kind !== 'microbe');
  return <div className={`slot${isSideways(card) ? ' slot--side' : ''}${over.length ? ' slot--worked' : ''}${under.length ? ' slot--prey' : ''}`}>
    <CardButton card={card} state={state} mark={markOf(card)} onTap={() => onTap(card)} onInspect={() => onInspect(card)} />
    {over.length > 0 && <div className="slot__workers" aria-label="Working cards">{over.map(c =>
      <CardButton key={c.uid} card={c} state={state} compact mark={markOf(c)} onTap={() => onTap(c)} onInspect={() => onInspect(c)} />)}</div>}
    {under.length > 0 && <div className="slot__under" aria-label="Cards underneath">{under.map(c =>
      <CardButton key={c.uid} card={c} state={state} compact mark={markOf(c)} onTap={() => onTap(c)} onInspect={() => onInspect(c)} />)}</div>}
  </div>;
}

/** Shared tap/long-press controls for a full card or an exposed card in a stack. */
function CardButton({ card, state, mark, compact, onTap, onInspect }: {
  card: CardInstance; state: GameState; mark?: Mark; compact?: boolean; onTap: () => void; onInspect: () => void;
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
    className={`card-tap${compact ? ' card-tap--compact' : ''}${mark ? ` is-${mark}` : ''}`}
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
    {compact ? <span className={`stack-card stack-card--${def.kind}`}>
      <strong>{def.name} <small>P{card.owner + 1}</small></strong>
      {isOrganism(def) && <span>Biomass {nutrientText(card.stored)}</span>}
      {def.kind === 'microbe' && <span>Assisting</span>}
      {isOrganism(def) && <span>{isInactiveOrganism(card, def)
        ? `${card.zone === 'attached' ? 'Eaten' : 'Dead'} — no production`
        : [def.release ? `Release ${nutrientText(def.release)}` : '', def.o2PerRound !== undefined ? `Upkeep ${def.o2PerRound} O₂` : ''].filter(Boolean).join(' · ')}</span>}
    </span> : <CardFace card={card} state={state} />}
    {!compact && adaptations > 0 && <span className="slot__badge" aria-hidden="true">
      {adaptations > 0 && <span>⭐{adaptations}</span>}
    </span>}
  </button>;
}
