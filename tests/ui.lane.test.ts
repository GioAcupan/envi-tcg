import { describe, expect, it } from 'vitest';
import { applyAction, newGame } from '../src/engine';
import { defaultRuleset } from '../src/ruleset';
import { cardActions, noTargetReason, targetedAction, validTargets } from '../src/ui/game/actions';

describe('UPDATE-1 tap targeting', () => {
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
  it('lights detritivore prey for consumers and only own living producers for adaptations', () => {
    let state = setup();
    const own = (id: string) => Object.values(state.cards).find(c => c.owner === 0 && c.defId === id)!;
    const plant = own('river-grass'), worm = own('aquatic-worm'), fish = own('small-fish'), adaptation = own('nutrient-rich-adaptation');
    for (const card of [plant, worm, fish]) state = applyAction(state, { type: 'play', player: 0, uid: card.uid });
    state = applyAction(state, { type: 'referee', op: { kind: 'setAp', player: 0, ap: 3 } });
    const otherPlant = Object.values(state.cards).find(c => c.owner === 1 && c.defId === 'river-grass')!;
    state = applyAction(state, { type: 'referee', op: { kind: 'moveCard', uid: otherPlant.uid, zone: 'field' } });
    state = applyAction(state, { type: 'referee', op: { kind: 'setStatus', uid: otherPlant.uid, status: 'alive' } });
    expect(validTargets(state, 'eat', 0, fish.uid)).toEqual([worm.uid]);
    expect(validTargets(state, 'playOn', 0, adaptation.uid)).toEqual([plant.uid]);
  });
});
