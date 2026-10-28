import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyAction, newGame } from '../src/engine';
import { defaultRuleset } from '../src/ruleset';
import { cardActions, noTargetReason, targetedAction, validTargets } from '../src/ui/game/actions';
import { CardFace } from '../src/ui/common/Card';
import { CardCloseup } from '../src/ui/game/CardCloseup';
import { BoardCard } from '../src/ui/game/BoardCard';

describe('card live facts', () => {
  it('keeps printed hand stats but hides inactive rates for dead cards', () => {
    const state = newGame(defaultRuleset(), 42);
    const card = Object.values(state.cards).find(c => c.defId === 'emergent-plant')!;
    card.zone = 'hand';
    const face = () => renderToStaticMarkup(createElement(CardFace, { state, card, full: true }));
    const closeup = () => renderToStaticMarkup(createElement(CardCloseup, {
      state, uid: card.uid, player: 0, dispatch: () => {}, onTarget: () => {}, onOpen: () => {}, onClose: () => {},
    }));
    expect(face()).toContain('pill--o2');
    card.zone = 'field'; card.status = 'dead';
    const html = closeup();
    expect(html).toContain('Remaining biomass');
    expect(html).toContain('no production');
    for (const text of ['pill--o2', 'pill--life', 'Growth / round', 'Yield / round', 'rounds left']) expect(html).not.toContain(text);
  });
  it('shows biomass only for organisms in stacks and closeups', () => {
    const state = newGame(defaultRuleset(), 42);
    const host = Object.values(state.cards).find(c => c.defId === 'emergent-plant')!;
    host.zone = 'field'; host.status = 'dead';
    const card = Object.values(state.cards).find(c => state.ruleset.cards.find(d => d.id === c.defId)?.kind === 'microbe')!;
    card.zone = 'attached'; card.attachedTo = host.uid;
    const html = renderToStaticMarkup(createElement(CardCloseup, {
      state, uid: card.uid, player: 0, dispatch: () => {}, onTarget: () => {}, onOpen: () => {}, onClose: () => {},
    }));
    expect(html).not.toContain('Biomass');
    expect(html).toContain('Takes / round');
    const board = renderToStaticMarkup(createElement(BoardCard, { state, card: host, markOf: () => undefined, onTap: () => {}, onInspect: () => {} }));
    const stacks = board.split('stack-card').slice(1).join('stack-card');
    expect(stacks).toContain('Assisting');
    expect(stacks).not.toContain('Biomass');
    const closeup = renderToStaticMarkup(createElement(CardCloseup, {
      state, uid: host.uid, player: 0, dispatch: () => {}, onTarget: () => {}, onOpen: () => {}, onClose: () => {},
    }));
    expect(closeup.split('attached-row').slice(1).join('attached-row')).not.toContain('chip--C');
  });
});

describe('tap targeting', () => {
  const setup = () => {
    const rules = defaultRuleset();
    rules.params.startingHand = 36;
    return newGame(rules, 42);
  };
  it('offers microbes only as targeted plays', () => {
    const state = setup();
    const microbe = Object.values(state.cards).find(c => c.owner === 0 && c.defId === 'carbon-bacteria')!;
    const actions = cardActions(state, microbe, 0);
    expect(actions.targeted).toEqual(['playOn']);
    expect(actions.direct.map(a => a.action.type)).toEqual(['discardDraw']);
    expect(noTargetReason(state, 'playOn', 0, microbe.uid)).toBe('Choose a dead card in the field');
  });
  it('uses the engine for assign-on-play AP and microbe targets', () => {
    let state = setup();
    const find = (id: string) => Object.values(state.cards).find(c => c.owner === 0 && c.defId === id)!;
    const plant = find('emergent-plant'), worm = find('aquatic-worm'), microbe = find('carbon-bacteria');
    state = applyAction(state, { type: 'play', player: 0, uid: plant.uid });
    state = applyAction(state, { type: 'referee', op: { kind: 'setStatus', uid: plant.uid, status: 'dead' } });
    expect(validTargets(state, 'playOn', 0, microbe.uid)).toContain(plant.uid);
    expect(validTargets(state, 'playOn', 0, worm.uid)).toContain(plant.uid);
    state = applyAction(state, targetedAction('playOn', 0, worm.uid, plant.uid));
    expect(state.players[0].ap).toBe(0);
    expect(state.cards[worm.uid].working).toBe(plant.uid);
    expect(noTargetReason(state, 'playOn', 0, microbe.uid)).toBe('Not enough AP');
  });
  it('offers living detritivores assignment and no eating', () => {
    let state = setup();
    const worm = Object.values(state.cards).find(c => c.owner === 0 && c.defId === 'aquatic-worm')!;
    state = applyAction(state, { type: 'play', player: 0, uid: worm.uid });
    expect(cardActions(state, state.cards[worm.uid], 0).targeted).toEqual(['assign']);
  });
});
