import { useState } from 'react';
import { defaultRuleset, loadRuleset, saveRuleset } from './ruleset';
import { GameScreen } from './ui/game/GameScreen';
import { EditorScreen } from './ui/editor/EditorScreen';
import { InterpretationsScreen } from './ui/interpretations/InterpretationsScreen';

/** App entry point: holds the editable ruleset shared by the three screens. */
export default function App() {
  const [ruleset, setRuleset] = useState(() => {
    try { return loadRuleset(); }
    catch { return defaultRuleset(); }
  });
  const [tab, setTab] = useState('Game');

  return <main>
    <h1>envi-tcg Playtest Simulator</h1>
    <nav aria-label="Screens">
      {['Game', 'Ruleset editor', 'Interpretations'].map(label =>
        <button key={label} aria-pressed={tab === label} onClick={() => setTab(label)}>{label}</button>,
      )}
    </nav>
    {tab === 'Game' && <GameScreen ruleset={ruleset} />}
    {tab === 'Ruleset editor' && <EditorScreen ruleset={ruleset} onChange={r => {
      setRuleset(r);
      try { saveRuleset(r); }
      catch { /* Keep edits usable while storage is stubbed or unavailable. */ }
    }} />}
    {tab === 'Interpretations' && <InterpretationsScreen />}
  </main>;
}
