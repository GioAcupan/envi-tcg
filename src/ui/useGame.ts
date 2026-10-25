import { useState } from 'react';
import { applyAction, newGame as createGame } from '../engine';
import type { Action, GameState, Ruleset } from '../engine';

/** Owns one match and its immutable history. New games use the latest ruleset;
 * edits never change a match in progress. Illegal actions show errors without adding undo steps. */
export function useGame(ruleset: Ruleset) {
  const [history, setHistory] = useState<{ past: GameState[]; state: GameState; future: GameState[] }>(() => ({
    past: [], state: createGame(ruleset, Date.now()), future: [],
  }));
  const enabled = history.state.ruleset.params.undoEnabled;
  return {
    state: history.state,
    dispatch(action: Action) {
      setHistory(h => {
        const state = applyAction(h.state, action);
        if (state.lastError) return { ...h, state };
        return { past: state.ruleset.params.undoEnabled ? [...h.past, h.state] : [], state, future: [] };
      });
    },
    undo() {
      setHistory(h => !h.state.ruleset.params.undoEnabled || !h.past.length ? h : ({
        past: h.past.slice(0, -1), state: h.past[h.past.length - 1], future: [h.state, ...h.future],
      }));
    },
    redo() {
      setHistory(h => !h.state.ruleset.params.undoEnabled || !h.future.length ? h : ({
        past: [...h.past, h.state], state: h.future[0], future: h.future.slice(1),
      }));
    },
    canUndo: enabled && history.past.length > 0,
    canRedo: enabled && history.future.length > 0,
    newGame(seed = Date.now()) { setHistory({ past: [], state: createGame(ruleset, seed), future: [] }); },
  };
}
