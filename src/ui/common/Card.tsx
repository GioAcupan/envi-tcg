import type { CardInstance, GameState } from '../../engine';

/** Public card face, including its attachments; hand secrecy is owned by the game screen. */
export function Card({ card, state, selected, onSelect }: {
  card: CardInstance; state: GameState; selected?: boolean; onSelect: () => void;
}) {
  const def = state.ruleset.cards.find(d => d.id === card.defId)!;
  const attachments = Object.values(state.cards).filter(c => c.zone === 'attached' && c.attachedTo === card.uid);
  return <article className={`card card--${def.kind} card--${card.status ?? 'hand'}${selected ? ' card--selected' : ''}`} data-uid={card.uid}>
    <button type="button" className="card-select" aria-pressed={!!selected} onClick={onSelect} aria-label={`Select ${def.name} ${card.uid}`}>
      <span className="card-kind">{def.kind}{def.subtype ? ` · ${def.subtype}` : ''}</span>
      <strong className="card-name">{def.name}</strong>
      <span className="card-cost">Cost {def.cost.C} C / {def.cost.N} N</span>
      <span className="card-status">{card.status ?? card.zone}{card.lifespanLeft !== undefined ? ` · Life ${card.lifespanLeft}` : ''}</span>
      <span className="card-stats">{def.o2Produced !== undefined ? `Produces ${def.o2Produced} O₂ · ` : ''}{def.o2PerRound !== undefined ? `Upkeep ${def.o2PerRound} O₂ · ` : ''}{def.trophicLevel ? `TL ${def.trophicLevel}` : ''}</span>
      <span className="card-stored">Stored: {card.stored.C} C · {card.stored.N} N · {card.stored.P} P · {card.stored.O2} O₂</span>
      <span className="card-text">{def.text}</span>
      {card.processing && <strong>Processing: {card.processing.roundsLeft} rounds left ({state.ruleset.cards.find(d => d.id === state.cards[card.processing!.by]?.defId)?.name ?? card.processing.by})</strong>}
      {!!card.marks && <span>Specialization marks: {card.marks}</span>}
      {card.specialized && <strong>Specialized</strong>}
      <small>{card.uid}</small>
    </button>
    {!!attachments.length && <ul className="card-attachments" aria-label="Attached cards">{attachments.map(c => <li key={c.uid}>{state.ruleset.cards.find(d => d.id === c.defId)?.name} ({c.uid})</li>)}</ul>}
    {!!card.adaptations.length && <p className="card-adaptations">★ {card.adaptations.map(id => state.ruleset.cards.find(d => d.id === id)?.name).join(', ')}</p>}
  </article>;
}
