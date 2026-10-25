import type { Ruleset } from '../../engine';

/** Placeholder for the game lane; receives the ruleset for the next match. */
export function GameScreen({ ruleset }: { ruleset: Ruleset }) {
  return <section><h2>Game</h2><p>Ruleset: {ruleset.name}</p><p>The match board is coming next.</p></section>;
}
