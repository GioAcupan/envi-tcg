import { useState } from 'react';
import type { Action, Ruleset } from '../../engine';
import { useGame } from '../useGame';
import { Card } from '../common/Card';
import { ActionButton } from '../common/ActionButton';
import { RefereePanel } from './RefereePanel';
import './game.css';

/** Hotseat board. The hand and private controls mount only after the current player accepts the device. */
export function GameScreen({ ruleset }: { ruleset: Ruleset }) {
  const game = useGame(ruleset);
  const { state } = game;
  const [revealedTurn, setRevealedTurn] = useState('');
  const [selection, setSelection] = useState<{ turn: string; source: string; target: string; pickingTarget: boolean }>({ turn: '', source: '', target: '', pickingTarget: false });
  const [seed, setSeed] = useState('');
  const [dismissedError, setDismissedError] = useState<GameStateError>(null);
  const player = state.pendingChoice?.player ?? state.activePlayer;
  const turn = `${state.round}-${state.activePlayer}-${player}`;
  const covered = revealedTurn !== turn && state.phase !== 'gameOver';
  const source = selection.turn === turn ? state.cards[selection.source] : undefined;
  const sourceDef = state.ruleset.cards.find(d => d.id === source?.defId);
  const target = selection.turn === turn && state.cards[selection.target] ? selection.target : '';
  const cards = Object.values(state.cards);
  const targets = cards.filter(c => c.zone === 'field' || c.zone === 'center');
  const select = (uid: string) => setSelection(s => s.turn === turn && s.pickingTarget
    ? { ...s, target: uid, pickingTarget: false }
    : { turn, source: uid, target: '', pickingTarget: false });
  const dispatch = (action: Action) => { setDismissedError(null); game.dispatch(action); };
  const button = (action: Action, label: string) => <ActionButton state={state} action={action} dispatch={dispatch}>{label}</ActionButton>;
  const face = (uid: string) => <Card key={uid} card={state.cards[uid]} state={state} selected={source?.uid === uid || target === uid} onSelect={() => select(uid)} />;
  return <section className={`game-shell game-shell--${state.isDay ? 'day' : 'night'}`} data-cycle={state.isDay ? 'day' : 'night'} aria-label="Match">
    <header className="game-status">
      <div><h2>Round {state.round} · {state.isDay ? 'Day' : 'Night'}</h2><p>{state.players[player].name}'s {state.pendingChoice ? 'choice' : 'turn'} · {state.players[state.activePlayer].ap} AP left</p></div>
      <div className="game-toolbar">
        <button type="button" disabled={!game.canUndo} title={!state.ruleset.params.undoEnabled ? 'Undo is disabled in this ruleset' : !game.canUndo ? 'No earlier action' : 'Restore previous action'} onClick={() => { game.undo(); setRevealedTurn(''); }}>Undo</button>
        <button type="button" disabled={!game.canRedo} title={!state.ruleset.params.undoEnabled ? 'Undo is disabled in this ruleset' : !game.canRedo ? 'No action to redo' : 'Restore next action'} onClick={() => { game.redo(); setRevealedTurn(''); }}>Redo</button>
        {!covered && button({ type: 'endTurn', player: state.activePlayer }, 'End turn')}
        <details className="new-game"><summary>New game</summary><p>Starts a fresh match using {ruleset.name}. The current match will be replaced.</p><label>Seed (optional)<input type="number" value={seed} onChange={e => setSeed(e.target.value)} /></label><button type="button" onClick={() => { game.newGame(seed === '' ? undefined : Number(seed)); setRevealedTurn(''); setSelection({ turn: '', source: '', target: '', pickingTarget: false }); }}>Start new game</button></details>
      </div>
    </header>
    <div className="player-statuses">{state.players.map(p => <section className={`player-status${p.id === state.activePlayer ? ' player-status--active' : ''}`} key={p.id} aria-label={`${p.name} resources`}>
      <h3>{p.name} {p.id === state.activePlayer && '· Active'} · {p.ap} AP</h3>
      <div className="pool-bar">{(['C', 'N', 'P', 'O2'] as const).map(n => <div className={`nutrient nutrient--${n}`} key={n}><strong>{n === 'O2' ? 'O₂' : n}: {p.pool[n]}</strong>{n !== 'O2' && <><span> / {state.ruleset.params.winThreshold[n]}</span><progress aria-label={`${p.name} ${n} win progress`} value={p.pool[n]} max={state.ruleset.params.winThreshold[n] || 1} /></>}</div>)}</div>
      <p>Deck {p.deck.length} · Hand {p.hand.length} · Discard {p.discard.length}</p>
    </section>)}</div>
    {state.phase === 'gameOver' && <div role="status" className="game-result"><h2>{state.winner === 'draw' ? 'Draw — both players reached the threshold' : `${state.players[state.winner as 0 | 1].name} wins!`}</h2><p>The match is complete. Review the log, undo, or start a new game.</p></div>}
    {covered ? <div className="pass-device" role="dialog" aria-modal="true" aria-labelledby="pass-title"><h2 id="pass-title">Pass the device to {state.players[player].name}</h2><p>Hands are hidden. Continue when the next player is ready.</p><button type="button" autoFocus onClick={() => setRevealedTurn(turn)}>I'm ready — reveal my hand</button></div> : <>
      {state.lastError && dismissedError !== state && <div className="toast" role="alert">{state.lastError}<button type="button" onClick={() => setDismissedError(state)}>Dismiss</button></div>}
      {state.pendingChoice && <section className="pending-choice" aria-label="Pending choice"><h3>{state.players[state.pendingChoice.player].name}: {state.pendingChoice.prompt}</h3>{state.pendingChoice.options.length ? state.pendingChoice.options.map(uid => <span key={uid}>{button({ type: 'choose', player: state.pendingChoice!.player, uid }, `${state.ruleset.cards.find(d => d.id === state.cards[uid].defId)?.name} (${uid})`)}</span>) : button({ type: 'choose', player: state.pendingChoice.player, uid: null }, 'Continue without an organism')}</section>}
      <section className="action-panel" aria-label="Card actions"><h3>{sourceDef ? `${sourceDef.name} (${source!.uid})` : 'Select a card to act'}</h3>
        {source && <>
          <div className="target-picker"><label>Action target<select aria-label="Action target" value={target} onChange={e => setSelection(s => ({ ...s, target: e.target.value, pickingTarget: false }))}><option value="">Choose a target</option>{targets.map(c => <option key={c.uid} value={c.uid}>{state.ruleset.cards.find(d => d.id === c.defId)?.name} · {c.uid} · {c.status} · {c.owner === null ? 'shared' : state.players[c.owner].name}</option>)}</select></label><button type="button" aria-pressed={selection.pickingTarget} onClick={() => setSelection(s => ({ ...s, pickingTarget: !s.pickingTarget }))}>{selection.pickingTarget ? 'Cancel target selection' : 'Pick target on board'}</button></div>
          <div className="card-actions">{source.zone === 'hand' ? <>
            {button({ type: 'play', player, uid: source.uid }, 'Play card')}
            {['adaptation', 'microbe', 'detritivore'].includes(sourceDef!.kind) && button({ type: 'play', player, uid: source.uid, targetUid: target || 'choose-target' }, 'Play on target')}
            {button({ type: 'discardDraw', player, uid: source.uid }, 'Discard and draw')}
          </> : <>
            {(sourceDef!.kind === 'consumer' || !!sourceDef!.canEat?.length) && button({ type: 'eat', player, eaterUid: source.uid, preyUid: target }, 'Eat target')}
            {sourceDef!.kind === 'detritivore' && button({ type: 'assign', player, detritivoreUid: source.uid, deadUid: target }, 'Assign to detritus')}
            {sourceDef!.kind === 'microbe' && button({ type: 'decompose', player, microbeUid: source.uid, detritusUid: target }, 'Decompose target')}
            {sourceDef!.kind === 'producer' && <p>Photosynthesis and aging happen automatically between rounds.</p>}
          </>}</div>
        </>}
      </section>
      <div className="game-board">{state.players.map(p => <section key={p.id} className={`zone-field${p.id === state.activePlayer ? ' zone-field--active' : ''}`} aria-label={`${p.name} field`}><h3>{p.name}'s field</h3><div className="card-row">{cards.filter(c => c.zone === 'field' && c.owner === p.id).map(c => face(c.uid))}</div>{!cards.some(c => c.zone === 'field' && c.owner === p.id) && <p>No organisms in play.</p>}</section>)}</div>
      <section className="zone-center" aria-label="Shared center"><h3>Shared center · dead matter</h3><div className="card-row">{state.center.map(face)}</div>{!state.center.length && <p>No shared detritus.</p>}</section>
      {state.phase !== 'gameOver' && <section className="zone-hand" aria-label={`${state.players[player].name} hand`}><h3>{state.players[player].name}'s hand</h3><div className="card-row">{state.players[player].hand.map(face)}</div>{!state.players[player].hand.length && <p>Your hand is empty. End your turn or use the referee panel.</p>}<p>The other player's hand is hidden.</p></section>}
      {!!state.modifiers.length && <section className="game-modifiers"><h3>Environmental effects</h3><ul>{state.modifiers.map((m, i) => <li key={`${m.id}-${i}`}>{state.ruleset.cards.find(d => d.id === m.source)?.name ?? m.source}: {m.effect} · {m.appliesTo}{m.activeRound !== undefined ? ` (round ${m.activeRound})` : ''}{m.player !== undefined ? ` · ${state.players[m.player].name}` : ' · both players'}</li>)}</ul></section>}
      <RefereePanel state={state} dispatch={dispatch} />
      <details className="game-log" open><summary>Game log · {state.log.length} entries · seed {state.seed}</summary><ol>{state.log.map((entry, i) => <li key={i}><strong>R{entry.round}</strong> {entry.text.includes(' draws ') || entry.text.includes(' replaces an opening ') ? 'Private draw (card identity hidden)' : entry.text}</li>)}</ol></details>
    </>}
  </section>;
}

type GameStateError = ReturnType<typeof useGame>['state'] | null;
