import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CardDef, CardInstance, GameState } from '../../engine';

function KindFallbackIcon({ kind }: { kind: CardDef['kind'] }): ReactNode {
  switch (kind) {
    case 'producer':
      return (
        <svg className="card__art-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case 'consumer':
      return (
        <svg className="card__art-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" />
          <path d="M2 12l4.5-3.5v7L2 12Z" />
          <circle cx="17" cy="11" r="1" fill="currentColor" />
        </svg>
      );
    case 'detritivore':
      return (
        <svg className="card__art-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15c2-4 6-6 11-5 3 .5 5 2.5 5 5 0 2-2 3.5-5 3.5-4 0-7-1.5-11-3.5Z" />
          <path d="M8 14v5M12 14v5M16 14v5" />
        </svg>
      );
    case 'microbe':
      return (
        <svg className="card__art-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 13a6 6 0 0 1 12 0H6Z" />
          <path d="M10 13v6a2 2 0 0 0 4 0v-6" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
          <circle cx="14" cy="9" r="1" fill="currentColor" />
        </svg>
      );
    case 'adaptation':
      return (
        <svg className="card__art-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'event':
      return (
        <svg className="card__art-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'token':
      return (
        <svg className="card__art-fallback-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 7C8 7 4 11 4 18c7 0 11-4 13-11Z" />
          <path d="M4 18L14 10" />
        </svg>
      );
  }
}

export function StarIcon({ className = 'ui-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" stroke="#1B221B" strokeWidth="1" aria-hidden="true">
      <polygon points="8 1.2 10.1 5.5 14.8 6.2 11.4 9.5 12.2 14.2 8 12 3.8 14.2 4.6 9.5 1.2 6.2 5.9 5.5 8 1.2" />
    </svg>
  );
}

function BoltIcon({ className = 'ui-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <polygon points="9 1 3 9 8 9 7 15 13 7 8 7 9 1" />
    </svg>
  );
}

function LeafIcon({ className = 'ui-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 3C6.5 3 3 6.5 3 13c6.5 0 10-3.5 10-10Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M3 13l7-6" />
    </svg>
  );
}

function HourglassIcon({ className = 'ui-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 2h8M4 14h8M5 2v2.5L8 8l3-3.5V2M5 14v-2.5L8 8l3 3.5V14" />
    </svg>
  );
}

function CrateIcon({ className = 'ui-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 5.5L8 2.5l5.5 3v5L8 13.5l-5.5-3v-5Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M2.5 5.5L8 8.5l5.5-3M8 8.5v5" />
    </svg>
  );
}

function PreyIcon({ className = 'ui-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <circle cx="8" cy="8" r="1.8" fill="currentColor" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" />
    </svg>
  );
}

function RespirationIcon({ className = 'ui-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v6M8 6C5.5 6 3 8 3 11.5c0 1.4 1 2 2.2 2 1.4 0 2.3-.9 2.3-2.5M8 6c2.5 0 5 2 5 5.5 0 1.4-1 2-2.2 2-1.4 0-2.3-.9-2.3-2.5" />
    </svg>
  );
}

function formatBadgeLabel(def: CardDef): string {
  if (def.kind === 'producer') {
    const sub = (def.subtype ?? 'plant').toUpperCase();
    return `${sub} · TL${def.trophicLevel ?? 1}`;
  }
  if (def.kind === 'consumer') {
    const raw = (def.subtype ?? 'consumer').toUpperCase();
    const sub = raw === 'SECONDARY' ? 'SECOND.' : raw === 'TERTIARY' ? 'TERT.' : raw;
    return `TL${def.trophicLevel ?? 2} ${sub}`;
  }
  if (def.kind === 'detritivore') {
    return (def.subtype ?? 'detritivore').toUpperCase();
  }
  if (def.kind === 'microbe') {
    const sub = def.subtype === 'fungus' ? 'FUNGI' : (def.subtype ?? 'MICROBE').toUpperCase();
    return `${sub} · 1 AP`;
  }
  if (def.kind === 'event') return 'WILD EVENT · 0 AP';
  if (def.kind === 'adaptation') return 'ADAPTATION';
  return 'TOKEN';
}

/** Public card face, including its attachments; hand secrecy is owned by the game screen. */
export function Card({ card, state, selected, onSelect }: {
  card: CardInstance; state: GameState; selected?: boolean; onSelect: () => void;
}) {
  const def = state.ruleset.cards.find(d => d.id === card.defId)!;
  const baseUrl = import.meta.env.BASE_URL;
  const [artFailed, setArtFailed] = useState(false);
  useEffect(() => { setArtFailed(false); }, [card.defId]);

  const attachments = Object.values(state.cards).filter(c => c.zone === 'attached' && c.attachedTo === card.uid);
  const workingOn = Object.values(state.cards).find(c => c.processing?.by === card.uid);
  const workingOnDef = workingOn ? state.ruleset.cards.find(d => d.id === workingOn.defId) : undefined;
  const processorCard = card.processing ? state.cards[card.processing.by] : undefined;
  const processorDef = processorCard ? state.ruleset.cards.find(d => d.id === processorCard.defId) : undefined;

  const isOrganism = def.kind === 'producer' || def.kind === 'consumer' || def.kind === 'detritivore';
  const isSideways = (card.zone === 'field' || card.zone === 'center') && (card.status === 'dead' || card.status === 'processed');
  const isUpgraded = card.adaptations.length > 0 || !!card.specialized;
  const isChoiceOption = !!state.pendingChoice?.options.includes(card.uid);

  const storedSig = `${card.stored.C}-${card.stored.N}-${card.stored.P}-${card.stored.O2}`;
  const prevStoredRef = useRef(storedSig);
  const [storedTick, setStoredTick] = useState(0);
  useEffect(() => {
    if (prevStoredRef.current !== storedSig) {
      prevStoredRef.current = storedSig;
      setStoredTick(t => t + 1);
    }
  }, [storedSig]);

  const cleanTags = def.tags.filter(t => t && t !== '–');
  const cleanPrey = (def.canEat ?? []).filter(t => t && t !== '–');
  const effectiveO2Prod = def.o2Produced !== undefined
    ? def.o2Produced + (card.adaptations.includes('oxygen-rich-adaptation') ? 2 : 0)
    : undefined;

  const hasCost = def.cost.C > 0 || def.cost.N > 0;
  const isBacteria = def.kind === 'microbe' && def.subtype === 'bacteria';
  const bacteriaBonusNutrient = def.id.startsWith('phosphorus') ? 'P' : 'N';

  const stackDepth = attachments.length;

  return (
    <div
      className={`card-stack${isSideways ? ' card-stack--sideways field-slot--sideways' : ''}${stackDepth ? ' card-stack--has-attachments' : ''}`}
      style={stackDepth ? ({ '--stack-count': stackDepth } as React.CSSProperties) : undefined}
    >
      <article
        className={[
          'card',
          `card--${def.kind}`,
          isOrganism ? 'card--organism' : '',
          `card--${card.status ?? 'hand'}`,
          isUpgraded ? 'card--upgraded' : '',
          isChoiceOption ? 'card--valid-target' : '',
          selected ? 'card--selected' : '',
        ].filter(Boolean).join(' ')}
        data-uid={card.uid}
      >
        <button
          type="button"
          className="card-select"
          aria-pressed={!!selected}
          onClick={onSelect}
          aria-label={`Select ${def.name} ${card.uid}`}
        >
          {/* 1. Top Cost & Archetype Strip */}
          <span className="card__header">
            <span className="card__costs card-cost" title={`Cost ${def.cost.C} C / ${def.cost.N} N`}>
              {hasCost ? (
                <>
                  {def.cost.C > 0 && (
                    <span className="cost-badge cost-badge--c">
                      <img src={`${baseUrl}art/c.svg`} alt="C" className="nutrient-icon-xs" />
                      <span className="card__cost-val">{def.cost.C}</span>
                    </span>
                  )}
                  {def.cost.N > 0 && (
                    <span className="cost-badge cost-badge--n">
                      <img src={`${baseUrl}art/n.svg`} alt="N" className="nutrient-icon-xs" />
                      <span className="card__cost-val">{def.cost.N}</span>
                    </span>
                  )}
                </>
              ) : (
                <span className="cost-badge cost-badge--free">
                  {def.kind === 'event' ? '0 AP' : def.kind === 'token' ? 'FFA' : '1 AP'}
                </span>
              )}
            </span>

            <span className={`card-kind card__badge card__badge--${def.kind}`}>
              {def.kind === 'event' && <BoltIcon />}
              {def.kind === 'adaptation' && <StarIcon />}
              {def.kind === 'token' && <LeafIcon />}
              <span>{formatBadgeLabel(def)}</span>
            </span>
          </span>

          {/* 2. Card Title Bar */}
          <span className="card__title-bar">
            <strong className="card-name card__title">
              {def.name}
              {isUpgraded && (
                <span className="card__special-star" title="Upgraded / Specialized">
                  <StarIcon />
                </span>
              )}
            </strong>
            <small className="card__uid">{card.uid}</small>
          </span>

          {/* 3. Illustration Viewport */}
          <span className="card__art-frame">
            {!artFailed ? (
              <img
                className="card__art"
                src={`${baseUrl}art/${card.defId}.svg`}
                alt=""
                loading="lazy"
                onError={() => setArtFailed(true)}
              />
            ) : (
              <span className="card__art-fallback" aria-hidden="true">
                <KindFallbackIcon kind={def.kind} />
                <span className="card__art-fallback-label">{def.kind}</span>
              </span>
            )}
          </span>

          {/* Sideways Status Stamps Positioned Over Card (Unclipped) */}
          {card.status === 'dead' && !card.processing && (
            <span className="card__status-banner card__status-banner--dead">
              DEAD MATTER
            </span>
          )}
          {card.status === 'dead' && card.processing && (
            <span className="card__status-banner card__status-banner--processing">
              PROCESSING: {card.processing.roundsLeft}r LEFT
              <small className="card__status-sub">
                by {processorDef?.name ?? card.processing.by}
              </small>
            </span>
          )}
          {card.status === 'processed' && (
            <span className="card__status-banner card__status-banner--processed">
              PROCESSED — READY FOR MICROBE
            </span>
          )}

          {/* 4. Vital Stats Bar */}
          <span className="card-stats card__stats-bar">
            {effectiveO2Prod !== undefined && (
              <span
                className={`stat-pill stat-pill--o2-prod${state.isDay && card.status === 'alive' ? ' stat-pill--day-halo' : !state.isDay ? ' stat-pill--night-dim' : ''}`}
                title={`Produces ${effectiveO2Prod} O₂ during Day`}
              >
                <img src={`${baseUrl}art/day.svg`} alt="Day" className="nutrient-icon-xs" />
                <span className="card__stat-val">+{effectiveO2Prod}</span>
                <img src={`${baseUrl}art/o2.svg`} alt="O₂" className="nutrient-icon-xs" />
              </span>
            )}
            {def.o2PerRound !== undefined && (
              <span
                className={`stat-pill stat-pill--o2-upkeep${!state.isDay && card.status === 'alive' ? ' stat-pill--night-emphasis' : ''}`}
                title={`Upkeep ${def.o2PerRound} O₂ per round`}
              >
                <RespirationIcon />
                <span className="card__stat-val">-{def.o2PerRound}</span>
                <img src={`${baseUrl}art/o2.svg`} alt="O₂" className="nutrient-icon-xs" />/r
              </span>
            )}
            {(card.lifespanLeft !== undefined || def.lifespan !== undefined) && (
              <span className="stat-pill stat-pill--life card-status" title="Lifespan remaining">
                <HourglassIcon />
                <span className="card__stat-val">
                  {card.lifespanLeft !== undefined ? `${card.lifespanLeft}/${def.lifespan ?? card.lifespanLeft}` : `${def.lifespan}`}
                </span>
              </span>
            )}
            {card.lifespanLeft === undefined && def.lifespan === undefined && (
              <span className="stat-pill stat-pill--zone card-status">{card.status ?? card.zone}</span>
            )}

            {/* Stored Biomass Pill */}
            <span
              key={`stored-${storedTick}`}
              className={`stat-pill stat-pill--stored card-stored${storedTick > 0 ? ' nutrient--tick' : ''}`}
              title={`Stored: ${card.stored.C} C, ${card.stored.N} N, ${card.stored.P} P, ${card.stored.O2} O₂`}
            >
              <CrateIcon />
              <span className="stored-chip">
                <img src={`${baseUrl}art/c.svg`} alt="C" className="nutrient-icon-2xs" />
                {card.stored.C}
              </span>
              {(card.stored.N > 0 || def.cost.N > 0) && (
                <span className="stored-chip">
                  <img src={`${baseUrl}art/n.svg`} alt="N" className="nutrient-icon-2xs" />
                  {card.stored.N}
                </span>
              )}
              {card.stored.P > 0 && (
                <span className="stored-chip">
                  <img src={`${baseUrl}art/p.svg`} alt="P" className="nutrient-icon-2xs" />
                  {card.stored.P}
                </span>
              )}
              {card.stored.O2 > 0 && (
                <span className="stored-chip">
                  <img src={`${baseUrl}art/o2.svg`} alt="O₂" className="nutrient-icon-2xs" />
                  {card.stored.O2}
                </span>
              )}
            </span>
          </span>

          {/* 5. Tags, Prey & Dynamic State Strip */}
          <span className="card__meta-strip">
            {cleanTags.length > 0 && (
              <span className="card__tags">{cleanTags.join(' • ')}</span>
            )}
            {cleanPrey.length > 0 && (
              <span className="card__prey">
                <PreyIcon /> Eats: {cleanPrey.join(', ')}
              </span>
            )}
            {isBacteria && (
              <span className={`card__state-pill ${card.flags.bacterialBonusUsed ? 'card__state-pill--used' : 'card__state-pill--ready'}`}>
                {card.flags.bacterialBonusUsed ? '[BONUS USED]' : `[+1 ${bacteriaBonusNutrient} BONUS READY]`}
              </span>
            )}
            {!!card.flags.shredded && (
              <span className="card__state-pill card__state-pill--shredded">
                +1C +1N SHREDDED
              </span>
            )}
            {!!card.marks && (
              <span className="card__state-pill card__state-pill--marks">
                {card.marks}/2 Marks
              </span>
            )}
            {card.specialized && (
              <strong className="card__state-pill card__state-pill--special">
                <StarIcon /> SPECIALIZED
              </strong>
            )}
            {workingOn && (
              <span className="card__state-pill card__state-pill--working">
                Working: {workingOnDef?.name ?? workingOn.uid} ({workingOn.processing?.roundsLeft}r)
              </span>
            )}
          </span>

          {/* 6. Rules Text Box */}
          <span className="card-text card__text">{def.text}</span>

          {!!card.adaptations.length && (
            <span className="card-adaptations">
              <StarIcon /> {card.adaptations.map(id => state.ruleset.cards.find(d => d.id === id)?.name).join(', ')}
            </span>
          )}
        </button>
      </article>

      {/* Upright Biomass Pill on Sideways Slot Corner */}
      {isSideways && (
        <div className="card__sideways-hud" aria-hidden="true">
          <span className="sideways-hud__pill">
            <CrateIcon /> {card.stored.C}C {card.stored.N}N{card.stored.P ? ` ${card.stored.P}P` : ''}
          </span>
          {!!card.flags.shredded && (
            <span className="sideways-hud__shredded">+1C +1N SHREDDED</span>
          )}
        </div>
      )}

      {/* Attached Cards Stacked Beneath Host (Prey & Adaptations) */}
      {!!attachments.length && (
        <ul className="card-attachments" aria-label="Attached cards">
          {attachments.map((att, idx) => {
            const attDef = state.ruleset.cards.find(d => d.id === att.defId);
            const isAdapt = attDef?.kind === 'adaptation';
            return (
              <li
                key={att.uid}
                className={`card--attached card-attachment card-attachment--${attDef?.kind ?? 'token'}`}
                style={{ '--att-index': idx + 1 } as React.CSSProperties}
              >
                <span className="card-attachment__strip">
                  <span className="card-attachment__role" aria-hidden="true">
                    {isAdapt ? <StarIcon /> : <PreyIcon />}
                  </span>
                  <img
                    src={`${baseUrl}art/${att.defId}.svg`}
                    alt=""
                    className="card-attachment__thumb"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="card-attachment__title">
                    {attDef?.name ?? att.defId} ({att.uid})
                  </span>
                  {!isAdapt && (att.stored.C > 0 || att.stored.N > 0 || att.stored.P > 0) && (
                    <span className="card-attachment__stored">
                      {att.stored.C}C{att.stored.N ? ` ${att.stored.N}N` : ''}
                    </span>
                  )}
                </span>
                {attDef?.text && (
                  <span className="card-attachment__detail">{attDef.text}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
