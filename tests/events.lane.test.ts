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
const endsLines = (state: GameState, round: number) => state.log.filter(e => e.round === round && /Drought ends for .* after round/.test(e.text));

function droughtRules() {
  const rules = testRuleset(); rules.cards.find(c => c.id === 'drought')!.copies = 1;
  return rules;
}

describe('Drought duration', () => {
  it('a Drought drawn at round start covers that round and the next for its drawer only, and its end is logged once', () => {
    let state = droughtOnTop(give(newGame(droughtRules(), 3), 1, 'drought'), 0);   // Player 2's Drought waits in hand
    state = endTurn(endTurn(state));                       // round 1 ends; the draw reveals Drought for round 2
    const droughtRound = state.round;
    for (const _turn of [1, 2, 3, 4]) {                    // both turns of the Drought round and of the next one
      expect(aquaticBlocked(state, 0)).toBe(true); expect(aquaticBlocked(state, 1)).toBe(false);
      state = endTurn(state);
    }
    expect(state.round).toBe(droughtRound + 2);
    expect(endsLines(state, droughtRound + 1)).toHaveLength(0);
    expect(aquaticBlocked(state, 0)).toBe(false);
    expect(endsLines(state, droughtRound + 2).map(e => e.text)).toEqual([`Round ${droughtRound + 2}: Drought ends for Player 1 after round ${droughtRound + 1}; put in their discard`]);
  });

  it('each player\'s Drought shows separately in the event panel with its rounds left', () => {
    let state = droughtOnTop(droughtOnTop(newGame(droughtRules(), 3), 0), 1);
    state = endTurn(endTurn(state));
    const effects = ['producers make 1 less O₂', 'aquatic cards cannot be played', 'aquatic plants cannot photosynthesize'];
    expect(activeEvents(state)).toEqual([
      { name: 'Drought', who: 'Player 1', roundsLeft: 2, effects },
      { name: 'Drought', who: 'Player 2', roundsLeft: 2, effects },
    ]);
    state = endTurn(endTurn(state));
    expect(activeEvents(state).map(e => e.roundsLeft)).toEqual([1, 1]);
    state = endTurn(endTurn(state));
    expect(activeEvents(state)).toEqual([]);
  });
});
