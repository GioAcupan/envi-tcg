import { useEffect, useRef, useState } from 'react';
import type { Action, Nutrient, Pool, Ruleset } from '../../engine';
import { useGame } from '../useGame';
import { Card } from '../common/Card';
import { ActionButton } from '../common/ActionButton';
import { RefereePanel } from './RefereePanel';
import './game.css';

const NUTRIENT_KEYS: readonly Nutrient[] = ['C', 'N', 'P', 'O2'];

/** Hotseat board. The hand and private controls mount only after the current player accepts the device. */
export function GameScreen({ ruleset }: { ruleset: Ruleset }) {
  const game = useGame(ruleset);
  const { state } = game;
  const baseUrl = import.meta.env.BASE_URL;
  const [revealedTurn, setRevealedTurn] = useState('');
  const [selection, setSelection] = useState<{ turn: string; source: string; target: string; pickingTarget: boolean }>({ turn: '', source: '', target: '', pickingTarget: false });
  const [seed, setSeed] = useState('');
  const [dismissedError, setDismissedError] = useState<GameStateError>(null);

  // Track nutrient pool changes to trigger @keyframes nutrient-tick on changed pills
  const prevPoolsRef = useRef<[Pool, Pool]>([
    { ...state.players[0].pool },
    { ...state.players[1].pool },
  ]);
  const [poolTicks, setPoolTicks] = useState<Record<string, number>>({});
  useEffect(() => {
    const updates: Record<string, number> = {};
    for (const p of state.players) {
      for (const n of NUTRIENT_KEYS) {
        if (prevPoolsRef.current[p.id][n] !== p.pool[n]) {
          updates[`${p.id}-${n}`] = (poolTicks[`${p.id}-${n}`] ?? 0) + 1;
        }
      }
    }
    prevPoolsRef.current = [
      { ...state.players[0].pool },
      { ...state.players[1].pool },
    ];
    if (Object.keys(updates).length > 0) {
      setPoolTicks(prev => ({ ...prev, ...updates }));
    }
  }, [state.players]);

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

  const maxAp = state.ruleset.params.apPerTurn;
  const activeAp = state.players[state.activePlayer].ap;

  return <section className={`game-shell game-shell--${state.isDay ? 'day' : 'night'}`} data-cycle={state.isDay ? 'day' : 'night'} aria-label="Match">
    <header className="game-status status-bar">
      <div className="status-bar__cycle">
        <img
          key={state.isDay ? 'day' : 'night'}
          className="cycle-emblem"
          src={`${baseUrl}art/${state.isDay ? 'day' : 'night'}.svg`}
          alt={state.isDay ? 'Day cycle' : 'Night cycle'}
        />
        <div className="status-bar__titles">
          <div className="status-bar__round-row">
            <h2>Round {state.round} · {state.isDay ? 'Day' : 'Night'}</h2>
            <span className={`cycle-pill cycle-pill--${state.isDay ? 'day' : 'night'}`}>
              <img src={`${baseUrl}art/${state.isDay ? 'day' : 'night'}.svg`} alt="" className="cycle-pill__icon" />
              {state.isDay ? 'DAY — Photosynthesis Active' : 'NIGHT — Respiration Only'}
            </span>
          </div>
          <p className="status-bar__turn-meta">
            <span>{state.players[player].name}'s {state.pendingChoice ? 'choice' : 'turn'} · {activeAp} AP left</span>
            <span className="ap-pips" aria-hidden="true">
              {Array.from({ length: Math.max(maxAp, activeAp) }, (_, i) => (
                <span key={i} className={`ap-pip${i < activeAp ? ' ap-pip--filled' : ''}`} />
              ))}
            </span>
          </p>
        </div>
      </div>

      {!!state.modifiers.length && (
        <div className="status-bar__modifiers" aria-label="Queued environmental modifiers">
          {state.modifiers.map((m, i) => (
            <span key={`${m.id}-${i}`} className="modifier-badge">
              <svg className="ui-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="9 1 3 9 8 9 7 15 13 7 8 7 9 1" /></svg>
              <span>{state.ruleset.cards.find(d => d.id === m.source)?.name ?? m.source}: {m.effect} ({m.appliesTo})</span>
            </span>
          ))}
        </div>
      )}

      <div className="game-toolbar">
        <button type="button" disabled={!game.canUndo} title={!state.ruleset.params.undoEnabled ? 'Undo is disabled in this ruleset' : !game.canUndo ? 'No earlier action' : 'Restore previous action'} onClick={() => { game.undo(); setRevealedTurn(''); }}>Undo</button>
        <button type="button" disabled={!game.canRedo} title={!state.ruleset.params.undoEnabled ? 'Undo is disabled in this ruleset' : !game.canRedo ? 'No action to redo' : 'Restore next action'} onClick={() => { game.redo(); setRevealedTurn(''); }}>Redo</button>
        {!covered && button({ type: 'endTurn', player: state.activePlayer }, 'End turn')}
        <details className="new-game"><summary>New game</summary><div className="new-game__popover"><p>Starts a fresh match using {ruleset.name}. The current match will be replaced.</p><label>Seed (optional)<input type="number" value={seed} onChange={e => setSeed(e.target.value)} /></label><button type="button" onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); game.newGame(seed === '' ? undefined : Number(seed)); setRevealedTurn(''); setSelection({ turn: '', source: '', target: '', pickingTarget: false }); }}>Start new game</button></div></details>
      </div>
    </header>

    <div className="player-statuses">{state.players.map(p => <section className={`player-status${p.id === state.activePlayer ? ' player-status--active' : ''}`} key={p.id} aria-label={`${p.name} resources`}>
      <div className="player-status__header">
        <h3>
          {p.name} {p.id === state.activePlayer && <span className="active-turn-badge">· Active</span>} · <span className="ap-counter">{p.ap} AP</span>
        </h3>
        <p className="player-zone-counts">
          <span className="deck-pill">
            <img src={`${baseUrl}art/card-back.svg`} alt="" className="deck-pill__icon" />
            Deck {p.deck.length}
          </span>
          <span>· Hand {p.hand.length}</span>
          <span>· Discard {p.discard.length}</span>
        </p>
      </div>
      <div className="pool-bar">{NUTRIENT_KEYS.map(n => {
        const tickCount = poolTicks[`${p.id}-${n}`] ?? 0;
        return (
          <div
            key={`${n}-${tickCount}`}
            className={`nutrient nutrient--${n}${tickCount > 0 ? ' nutrient--tick' : ''}`}
          >
            <div className="nutrient__top">
              <img src={`${baseUrl}art/${n.toLowerCase()}.svg`} alt="" className="nutrient__icon" />
              <strong className="nutrient__value">{n === 'O2' ? 'O₂' : n}: {p.pool[n]}</strong>
              {n !== 'O2' && <span className="nutrient__threshold"> / {state.ruleset.params.winThreshold[n]}</span>}
            </div>
            {n !== 'O2' && (
              <progress
                aria-label={`${p.name} ${n} win progress`}
                value={p.pool[n]}
                max={state.ruleset.params.winThreshold[n] || 1}
              />
            )}
          </div>
        );
      })}</div>
    </section>)}</div>

    {state.phase === 'gameOver' && <div role="status" className="game-result"><h2>{state.winner === 'draw' ? 'Draw — both players reached the threshold' : `${state.players[state.winner as 0 | 1].name} wins!`}</h2><p>The match is complete. Review the log, undo, or start a new game.</p></div>}

    {covered ? <div className="pass-device pass-device-overlay" role="dialog" aria-modal="true" aria-labelledby="pass-title">
      <img src={`${baseUrl}art/card-back.svg`} alt="" className="pass-device__emblem" />
      <h2 id="pass-title">Pass the device to {state.players[player].name}</h2>
      <p>Hands are hidden during hotseat transitions. Continue when {state.players[player].name} has the screen.</p>
      <button type="button" autoFocus onClick={() => setRevealedTurn(turn)}>I'm ready — reveal my hand</button>
    </div> : <>
      {state.lastError && dismissedError !== state && <div className="toast" role="alert"><span>{state.lastError}</span><button type="button" onClick={() => setDismissedError(state)}>Dismiss</button></div>}
      {state.pendingChoice && <section className="pending-choice choice-banner" aria-label="Pending choice"><h3>{state.players[state.pendingChoice.player].name}: {state.pendingChoice.prompt}</h3><div className="choice-banner__options">{state.pendingChoice.options.length ? state.pendingChoice.options.map(uid => <span key={uid}>{button({ type: 'choose', player: state.pendingChoice!.player, uid }, `${state.ruleset.cards.find(d => d.id === state.cards[uid].defId)?.name} (${uid})`)}</span>) : button({ type: 'choose', player: state.pendingChoice.player, uid: null }, 'Continue without an organism')}</div></section>}
      <section className={`action-panel${selection.pickingTarget ? ' action-panel--picking' : ''}`} aria-label="Card actions">
        <div className="action-panel__head">
          <h3>{sourceDef ? `${sourceDef.name} (${source!.uid})` : 'Select a card in hand or field to act'}</h3>
          {source && (
            <span className="action-panel__selected-meta">
              Zone: <strong>{source.zone}</strong>
              {target && state.cards[target] && (
                <> · Target: <strong>{state.ruleset.cards.find(d => d.id === state.cards[target].defId)?.name} ({target})</strong></>
              )}
            </span>
          )}
        </div>
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
            {sourceDef!.kind === 'producer' && <p className="action-panel__hint">Photosynthesis and aging happen automatically between rounds.</p>}
          </>}</div>
        </>}
      </section>

      <div className="game-board board">{state.players.map(p => {
        const fieldCards = cards.filter(c => c.zone === 'field' && c.owner === p.id);
        const isActive = p.id === state.activePlayer;
        return (
          <section
            key={p.id}
            className={`zone-field ${isActive ? 'zone-field--active' : 'zone-field--opponent'}`}
            aria-label={`${p.name} field`}
          >
            <div className="zone-header">
              <h3>{p.name}'s field {isActive ? '· Active Habitat' : '· Opponent Habitat'}</h3>
              <span className="zone-header__counts">
                <img src={`${baseUrl}art/card-back.svg`} alt="" className="zone-header__deck-icon" />
                Deck: {p.deck.length} · Discard: {p.discard.length}
              </span>
            </div>
            <div className="card-row">{fieldCards.map(c => face(c.uid))}</div>
            {!fieldCards.length && <p className="zone-empty">No organisms in play.</p>}
          </section>
        );
      })}</div>

      <section className="zone-center" aria-label="Shared center">
        <div className="zone-header">
          <h3>
            <img src={`${baseUrl}art/fallen-leaf.svg`} alt="" className="zone-header__token-icon" />
            <span>Shared Riparian Center · Dead Matter (FFA)</span>
          </h3>
          <span className="zone-header__counts">{state.center.length} detritus token{state.center.length === 1 ? '' : 's'}</span>
        </div>
        <div className="card-row">{state.center.map(face)}</div>
        {!state.center.length && <p className="zone-empty">No shared detritus.</p>}
      </section>

      {state.phase !== 'gameOver' && (
        <section className="zone-hand" aria-label={`${state.players[player].name} hand`}>
          <div className="zone-header">
            <h3>{state.players[player].name}'s hand ({state.players[player].hand.length} cards)</h3>
            <p className="zone-hand__privacy-note">The other player's hand is hidden.</p>
          </div>
          <div className="card-row">{state.players[player].hand.map(face)}</div>
          {!state.players[player].hand.length && <p className="zone-empty">Your hand is empty. End your turn or use the referee panel.</p>}
        </section>
      )}

      {!!state.modifiers.length && <section className="game-modifiers"><h3>Active & Queued Environmental Effects</h3><ul>{state.modifiers.map((m, i) => <li key={`${m.id}-${i}`}><strong>{state.ruleset.cards.find(d => d.id === m.source)?.name ?? m.source}</strong>: {m.effect} · {m.appliesTo}{m.activeRound !== undefined ? ` (round ${m.activeRound})` : ''}{m.player !== undefined ? ` · ${state.players[m.player].name}` : ' · both players'}</li>)}</ul></section>}

      <div className="bottom-drawers">
        <RefereePanel state={state} dispatch={dispatch} />
        <details className="game-log log-drawer" open>
          <summary>Field Journal Log · {state.log.length} entries · seed {state.seed}</summary>
          <ol>{state.log.map((entry, i) => <li key={i}><strong className="log-round-badge">R{entry.round}</strong> <span>{entry.text.includes(' draws ') || entry.text.includes(' replaces an opening ') ? 'Private draw (card identity hidden)' : entry.text}</span></li>)}</ol>
        </details>
      </div>
    </>}
  </section>;
}

type GameStateError = ReturnType<typeof useGame>['state'] | null;
