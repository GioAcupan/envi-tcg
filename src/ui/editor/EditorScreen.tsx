import type { Ruleset } from '../../engine';

/** Placeholder for the editor lane; reports edited rulesets to the app. */
export function EditorScreen({ ruleset }: { ruleset: Ruleset; onChange: (ruleset: Ruleset) => void }) {
  return <section><h2>Ruleset editor</h2><p>Ruleset: {ruleset.name}</p><p>Card and parameter editing is coming next.</p></section>;
}
