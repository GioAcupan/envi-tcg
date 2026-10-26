import { useEffect, useState, type ReactNode } from 'react';
import type { CardDef, CardInstance, GameState, Pool } from '../../engine';

/** URL of an SVG in public/art/. The app is served under a subpath, so never use a leading slash. */
export const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.svg`;

export const defOf = (state: GameState, card: CardInstance): CardDef =>
  state.ruleset.cards.find(d => d.id === card.defId)!;

/** Rule C.2: dead cards on the board are turned sideways. */
export const isSideways = (card: CardInstance) =>
  card.zone === 'field' && card.status === 'dead';

export const attachmentsOf = (state: GameState, uid: string) =>
  Object.values(state.cards).filter(c => c.zone === 'attached' && c.attachedTo === uid);

function KindIcon({ kind }: { kind: CardDef['kind'] }): ReactNode {
  const paths: Record<CardDef['kind'], ReactNode> = {
    producer: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>,
    consumer: <><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" /><path d="M2 12l4.5-3.5v7L2 12Z" /></>,
    detritivore: <><path d="M4 15c2-4 6-6 11-5 3 .5 5 2.5 5 5 0 2-2 3.5-5 3.5-4 0-7-1.5-11-3.5Z" /><path d="M8 14v5M12 14v5M16 14v5" /></>,
    microbe: <><path d="M6 13a6 6 0 0 1 12 0H6Z" /><path d="M10 13v6a2 2 0 0 0 4 0v-6" /></>,
    adaptation: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    event: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  };
  return <svg className="cf__fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export function StarIcon() {
  return <svg className="ui-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <polygon points="8 1.2 10.1 5.5 14.8 6.2 11.4 9.5 12.2 14.2 8 12 3.8 14.2 4.6 9.5 1.2 6.2 5.9 5.5 8 1.2" />
  </svg>;
}

/** Full archetype label. */
export function kindLabel(def: CardDef): string {
  const sub = (def.subtype ?? def.kind).toUpperCase();
  if (def.kind === 'producer') return sub;
  if (def.kind === 'consumer') return sub;
  if (def.kind === 'microbe') return def.subtype === 'fungus' ? 'FUNGI' : sub;
  if (def.kind === 'event') return 'WILD EVENT';
  if (def.kind === 'adaptation') return 'ADAPTATION';
  if (def.kind === 'detritivore') return sub;
  return 'TOKEN';
}

/** Short label that fits a board-sized card header. */
function shortKind(def: CardDef): string {
  if (def.kind === 'producer') return (def.subtype ?? 'plant').toUpperCase();
  if (def.kind === 'consumer') return 'SECONDARY';
  if (def.kind === 'microbe') return def.subtype === 'fungus' ? 'FUNGI' : 'BACT.';
  if (def.kind === 'adaptation') return 'ADAPT';
  if (def.kind === 'event') return 'EVENT';
  return (def.subtype ?? 'detrit.').toUpperCase();
}

export function statusLabel(card: CardInstance): string | undefined {
  if (card.status === 'dead') return 'DEAD';
  return undefined;
}

/** Nutrient chips for a pool. Zero values are hidden, except C, so an empty card still reads "C 0". */
export function PoolChips({ pool, all }: { pool: Pool; all?: boolean }) {
  return <span className="chips">
    {(['C', 'N', 'P', 'O2'] as const).filter(n => all || n === 'C' || pool[n] > 0).map(n =>
      <span key={n} className={`chip chip--${n}`}><img src={art(n.toLowerCase())} alt={n === 'O2' ? 'O₂' : n} />{pool[n]}</span>)}
  </span>;
}

function Art({ card, def }: { card: CardInstance; def: CardDef }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [card.defId]);
  return <span className="cf__art">
    {failed
      ? <span className="cf__fallback"><KindIcon kind={def.kind} /></span>
      : <img src={art(card.defId)} alt="" draggable={false} onError={() => setFailed(true)} />}
  </span>;
}

/** A card's printed face; it fills its parent's box and scales its type with its own width.
 *  `full` adds tags, diet and rules text for the closeup; board faces stay glanceable.
 *  Dead board cards get a landscape (sideways) face whose text stays upright. */
export function CardFace({ card, state, full }: { card: CardInstance; state: GameState; full?: boolean }) {
  const def = defOf(state, card);
  const upgraded = card.adaptations.length > 0 || !!card.specialized;
  const status = statusLabel(card);
  const classes = `cf cf--${def.kind} cf--${card.status ?? 'none'}${upgraded ? ' cf--upgraded' : ''}${full ? ' cf--full' : ''}`;
  const o2Prod = def.yield?.O2 !== undefined
    ? def.yield?.O2 + (card.adaptations.includes('oxygen-rich-adaptation') ? 2 : 0) : undefined;
  const eats = (def.canEat ?? []).filter(t => t && t !== '–');

  if (!full && isSideways(card)) {
    return <span className={`${classes} cf--side`}>
      <span className="cf__band" aria-hidden="true">{shortKind(def)}</span>
      <Art card={card} def={def} />
      <span className="cf__side-info">
        <span className="cf__name">{def.name}</span>
        <span className={`cf__stamp cf__stamp--${card.status}`} title={status}>{status}</span>
        <PoolChips pool={card.stored} />
      </span>
    </span>;
  }

  return <span className={classes}>
    <span className="cf__head">
      <span className="cf__cost">
        {def.cost.C > 0 && <span className="cf__cost-chip"><img src={art('c')} alt="C" />{def.cost.C}</span>}
        {def.cost.N > 0 && <span className="cf__cost-chip"><img src={art('n')} alt="N" />{def.cost.N}</span>}
        {!def.cost.C && !def.cost.N && <span className="cf__cost-chip">{def.kind === 'event' ? '0 AP' : `${state.ruleset.params.playApCost} AP`}</span>}
      </span>
      <span className="cf__kind">{full ? kindLabel(def) : shortKind(def)}</span>
    </span>
    <span className="cf__name">{def.name}{upgraded && <span className="cf__star"><StarIcon /></span>}</span>
    <Art card={card} def={def} />
    {status && <span className={`cf__stamp cf__stamp--${card.status}`}>{status}</span>}
    <span className="cf__stats">
      {o2Prod !== undefined && <span className={`pill pill--o2`} title={`Produces ${o2Prod} O₂ each round`}><img src={art('o2')} alt="O?" />+{o2Prod}</span>}
      {def.o2PerRound !== undefined && <span className={`pill pill--upkeep`} title={`Uses ${def.o2PerRound} O₂ each round`}><img src={art('o2')} alt="O₂" />−{def.o2PerRound}</span>}
      {(card.lifespanLeft !== undefined || def.lifespan !== undefined) && <span className="pill pill--life" title="Lifespan left">⏳{card.lifespanLeft ?? def.lifespan}</span>}
      {card.zone !== 'hand' && card.zone !== 'deck' && <span className="pill pill--stored" title="Stored nutrients"><PoolChips pool={card.stored} /></span>}
    </span>
    {full && <>
      {(def.tags.length > 0 || eats.length > 0) && <span className="cf__meta">
        {def.tags.filter(t => t && t !== '–').join(' • ')}
        {eats.length > 0 && <> · Eats: {eats.join(', ')}</>}
      </span>}
      <span className="cf__text">{def.text}</span>
    </>}
  </span>;
}
