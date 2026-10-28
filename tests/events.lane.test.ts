import { describe, expect, it } from 'vitest';
import { applyAction, newGame, type GameState, type PlayerId } from '../src/engine';
import { activeEvents } from '../src/ui/game/actions';
import { testRuleset, give, ref } from './acceptance/helpers';

const aquaticBlocked = (state: GameState, player: PlayerId) =>
  state.modifiers.some(m => m.effect === 'noAquaticPlay' && m.activeRound === state.round && (m.player === undefined || m.player === player));

/** Put the player's Drought on top of their deck, so the next round-end draw reveals it. */
function droughtOnTop(state: GameState, player: PlayerId): GameState {
  state = give(state, player, 'drought');
  const drought = state.players[player].hand.find(uid => state.cards[uid].defId === 'drought')!;
  state = ref(state, { kind: 'moveCard', uid: drought, zone: 'deck', owner: player });
  // moveCard appends to the deck; moving every other deck card behind it leaves Drought on top.
  for (const uid of state.players[player].deck.filter(uid => uid !== drought)) state = ref(state, { kind: 'moveCard', uid, zone: 'deck', owner: player });
  expect(state.players[player].deck[0]).toBe(drought);
  return state;
}

const endTurn = (state: GameState) => applyAction(state, { type: 'endTurn', player: state.activePlayer });
const endsLines = (state: GameState, round: number) => state.log.filter(e => e.round === round && /Drought.* ends after round/.test(e.text));

function droughtRules() {
  const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
  return rules;
}

describe('Drought duration', () => {
  it('a Drought drawn at round start covers both turns of that round only, and its end is logged once', () => {
    let state = droughtOnTop(newGame(droughtRules(), 3), 0);
    state = endTurn(endTurn(state));                       // round 1 ends; the draw reveals Drought for round 2
    const droughtRound = state.round;
    expect(aquaticBlocked(state, 0) && aquaticBlocked(state, 1)).toBe(true);   // first turn of the Drought round
    state = endTurn(state);
    expect(aquaticBlocked(state, 0) && aquaticBlocked(state, 1)).toBe(true);   // second turn of the Drought round
    expect(endsLines(state, droughtRound)).toHaveLength(0);
    state = endTurn(state);
    expect(state.round).toBe(droughtRound + 1);
    expect(aquaticBlocked(state, 0) || aquaticBlocked(state, 1)).toBe(false);  // gone in the next round
    expect(state.modifiers).toHaveLength(0);
    expect(endsLines(state, droughtRound + 1).map(e => e.text)).toEqual([`Round ${droughtRound + 1}: Drought ends after round ${droughtRound}`]);
  });

  it('two Droughts drawn in the same round stack, show as ×2 and end with one log line', () => {
    let state = droughtOnTop(droughtOnTop(newGame(droughtRules(), 3), 0), 1);
    state = endTurn(endTurn(state));
    const droughtRound = state.round;
    expect(activeEvents(state)).toEqual([{
      name: 'Drought', copies: 2, who: 'both players',
      effects: ['producers make 2 less O₂', 'aquatic cards cannot be played', 'aquatic plants cannot photosynthesize'],
    }]);
    state = endTurn(endTurn(state));
    expect(activeEvents(state)).toEqual([]);
    expect(endsLines(state, droughtRound + 1).map(e => e.text)).toEqual([`Round ${droughtRound + 1}: Drought ×2 ends after round ${droughtRound}`]);
  });
});
