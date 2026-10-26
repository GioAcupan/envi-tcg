import { useEffect, useState } from 'react';
import { defaultRuleset, loadRuleset, saveRuleset } from './ruleset';
import { GameScreen } from './ui/game/GameScreen';
import { EditorScreen } from './ui/editor/EditorScreen';
import { InterpretationsScreen } from './ui/interpretations/InterpretationsScreen';
import type { Ruleset } from './engine';

/** Screens are addressed by URL hash, so the game's own menu can link to them without extra props. */
const SCREENS = [{ hash: '', label: 'Game' }, { hash: '#editor', label: 'Ruleset editor' }, { hash: '#interpretations', label: 'Interpretations' }];
const currentHash = () => SCREENS.some(s => s.hash === window.location.hash) ? window.location.hash : '';

/** App entry point: holds the editable ruleset shared by the three screens. The game screen fills the
 *  viewport and stays mounted while the other screens are open, so a match survives a visit to the editor. */
export default function App() {
  const [ruleset, setRuleset] = useState(() => {
    try { return loadRuleset(); }
    catch { return defaultRuleset(); }
  });
  const [hash, setHash] = useState(currentHash);
  useEffect(() => {
    const onHash = () => setHash(currentHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const changeRuleset = (r: Ruleset) => {
    setRuleset(r);
    try { saveRuleset(r); }
    catch { /* Keep edits usable while storage is stubbed or unavailable. */ }
  };
  return <>
    <div className="app-game" hidden={hash !== ''}><GameScreen ruleset={ruleset} onRulesetChange={changeRuleset} /></div>
    {hash !== '' && <main className="app-page">
      <header className="app-bar">
        <h1>envi-tcg Playtest Simulator</h1>
        <nav aria-label="Screens">
          {SCREENS.map(s => <a key={s.label} href={s.hash || '#'} aria-current={hash === s.hash ? 'page' : undefined}>{s.label}</a>)}
        </nav>
      </header>
      {hash === '#editor' && <EditorScreen ruleset={ruleset} onChange={changeRuleset} />}
      {hash === '#interpretations' && <InterpretationsScreen />}
    </main>}
  </>;
}
