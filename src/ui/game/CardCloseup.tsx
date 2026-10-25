import type { ReactNode } from 'react';
import type { Action, GameState, PlayerId } from '../../engine';
import { ActionButton } from '../common/ActionButton';
import { art, attachmentsOf, CardFace, defOf, kindLabel, PoolChips, StarIcon } from '../common/Card';
import { Sheet } from '../common/Sheet';
import { cardActions, noTargetReason, TARGET_VERB, validTargets, type TargetKind } from './actions';

/** Large, readable view of one card with every fact the engine tracks and the viewer's actions for it.
 *  Targeted actions hand off to board targeting through onTarget; attached cards open in place via onOpen. */
export function CardCloseup({ state, uid, player, pickTarget, dispatch, onTarget, onOpen, onClose }: {
  state: GameState; uid: string; player: PlayerId;
  /** Set while the board is waiting for a target and this card is a valid one. */
  pickTarget?: { label: string; pick: () => void };
  dispatch: (action: Action) => void; onTarget: (kind: TargetKind) => void; onOpen: (uid: string) => void; onClose: () => void;
}) {
  const card = state.cards[uid];
  const def = defOf(state, card);
  const params = state.ruleset.params;
  const attachments = attachmentsOf(state, uid);
  const workingOn = Object.values(state.cards).find(c => c.processing?.by === uid);
  const name = (id: string) => defOf(state, state.cards[id]).name;
  const owner = card.owner === null ? 'Shared' : state.players[card.owner].name;
  const actions = state.pendingChoice ? { direct: [], targeted: [] } : cardActions(state, card, player);
  const choice = state.pendingChoice?.options.includes(uid) ? state.pendingChoice : undefined;
  const fact = (label: string, value: ReactNode) => <><dt>{label}</dt><dd>{value}</dd></>;
  const o2Prod = def.o2Produced !== undefined ? def.o2Produced + (card.adaptations.includes('oxygen-rich-adaptation') ? 2 : 0) : undefined;
  const apCost = def.kind === 'event' ? 0 : params.playApCost;

  return <Sheet label={`${def.name} closeup`} onClose={onClose}>
    <div className="closeup">
      <div className="closeup__card"><CardFace card={card} state={state} full /></div>
      <div className="closeup__info">
        <h2>{def.name}{(card.adaptations.length > 0 || card.specialized) && <span className="cf__star"> <StarIcon /></span>}</h2>
        <p className="closeup__sub">{kindLabel(def)} · {owner} · {card.zone}{card.status ? ` · ${card.status}` : ''}</p>

        {(actions.direct.length > 0 || actions.targeted.length > 0 || pickTarget || choice) && <div className="closeup__actions">
          {pickTarget && <button type="button" className="btn btn--primary" onClick={pickTarget.pick}>{pickTarget.label}</button>}
          {choice && <ActionButton state={state} action={{ type: 'choose', player: choice.player, uid }} dispatch={dispatch} className="act--primary">Choose this organism</ActionButton>}
          {actions.targeted.map(kind => {
            const count = validTargets(state, kind, player, uid).length;
            const reason = count ? undefined : noTargetReason(state, kind, player, uid);
            return <span key={kind} className="act act--primary">
              <button type="button" className="btn" disabled={!!reason} onClick={() => onTarget(kind)}>{TARGET_VERB[kind]}… <small>{count ? `${count} target${count === 1 ? '' : 's'}` : ''}</small></button>
              {reason && <span className="act__reason">{reason}</span>}
            </span>;
          })}
          {actions.direct.map(a => <ActionButton key={a.label} state={state} action={a.action} dispatch={dispatch}>{a.label}</ActionButton>)}
        </div>}
        {actions.hint && <p className="closeup__hint">{actions.hint}</p>}

        <dl className="closeup__facts">
          {def.kind !== 'token' && fact('Cost', <>{def.cost.C} C · {def.cost.N} N · {apCost} AP</>)}
          {o2Prod !== undefined && fact('O₂ made', <>+{o2Prod} each Day{!state.isDay && ' (Night now: none)'}</>)}
          {def.o2PerRound !== undefined && fact('O₂ upkeep', <>−{def.o2PerRound} each round</>)}
          {(card.lifespanLeft !== undefined || def.lifespan !== undefined) && fact('Lifespan', card.lifespanLeft !== undefined ? `${card.lifespanLeft} of ${def.lifespan ?? card.lifespanLeft} rounds left` : `${def.lifespan} rounds`)}
          {card.zone !== 'hand' && fact('Stored', <PoolChips pool={card.stored} all />)}
          {card.processing && fact('Processing', <>by {name(card.processing.by)}, {card.processing.roundsLeft} round{card.processing.roundsLeft === 1 ? '' : 's'} left</>)}
          {workingOn && fact('Working on', <>{name(workingOn.uid)} ({workingOn.processing?.roundsLeft}r left)</>)}
          {!!card.marks && fact('Marks', <>{card.marks}/2{card.specialized ? ' · specialized' : ''}</>)}
          {!card.marks && card.specialized && fact('Marks', 'Specialized')}
          {def.kind === 'microbe' && def.subtype === 'bacteria' && card.zone === 'field' && fact('Bonus', card.flags.bacterialBonusUsed ? 'Used' : 'Ready')}
          {!!card.flags.shredded && fact('Shredded', '+1 C +1 N')}
          {card.attachedTo && state.cards[card.attachedTo] && fact('Under', <button type="button" className="link" onClick={() => onOpen(card.attachedTo!)}>{name(card.attachedTo)}</button>)}
          {card.adaptations.length > 0 && fact('Adaptations', <>⭐ {card.adaptations.map(id => state.ruleset.cards.find(d => d.id === id)?.name ?? id).join(', ')}</>)}
        </dl>

        {attachments.length > 0 && <section className="closeup__attached" aria-label="Attached cards">
          <h3>Attached ({attachments.length})</h3>
          <ul>{attachments.map(a => <li key={a.uid}>
            <button type="button" className="attached-row" onClick={() => onOpen(a.uid)}>
              <img src={art(a.defId)} alt="" />
              <span>{defOf(state, a).kind === 'adaptation' ? '⭐ ' : ''}{defOf(state, a).name}</span>
              <PoolChips pool={a.stored} />
            </button>
          </li>)}</ul>
        </section>}
      </div>
    </div>
  </Sheet>;
}
