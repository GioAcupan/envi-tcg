import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { checkAction } from '../../engine';
import type { Action, CardInstance, GameState, LogEntry, Nutrient, PlayerState, Pool, Ruleset } from '../../engine';
import { useGame } from '../useGame';
import { ActionButton } from '../common/ActionButton';
import { art, defOf, isSideways } from '../common/Card';
import { Sheet } from '../common/Sheet';
import { BoardCard, type Mark } from './BoardCard';
import { CardCloseup } from './CardCloseup';
import { RefereePanel } from './RefereePanel';
import { TARGET_VERB, targetedAction, targetPrompt, validTargets, type TargetKind } from './actions';
import './game.css';

const NUTRIENTS: readonly Nutrient[] = ['C', 'N', 'P', 'O2'];
type Drawer = 'match' | 'log' | 'referee';
const DRAWER_TABS: [Drawer, string][] = [['match', 'Match'], ['log', 'Log'], ['referee', 'Referee']];

/** Draw entries name the drawn card, which would leak the hand in hotseat play. */
const logText = (entry: LogEntry) =>
  entry.text.includes(' draws ') || entry.text.includes(' replaces an opening ') ? 'Private draw (card identity hidden)' : entry.text;

/** Counts changes per `${player}-${nutrient}` so the HUD can replay its tick animation. */
function usePoolTicks(players: GameState['players']) {
  const previous = useRef<[Pool, Pool]>([{ ...players[0].pool }, { ...players[1].pool }]);
  const [ticks, setTicks] = useState<Record<string, number>>({});
  useEffect(() => {
    const changed = players.flatMap(p => NUTRIENTS.filter(n => previous.current[p.id][n] !== p.pool[n]).map(n => `${p.id}-${n}`));
    previous.current = [{ ...players[0].pool }, { ...players[1].pool }];
    if (changed.length) setTicks(t => ({ ...t, ...Object.fromEntries(changed.map(k => [k, (t[k] ?? 0) + 1])) }));
  }, [players]);
  return ticks;
}

/** Slim per-player status strip: AP pips, pools with win targets, pile counts. */
function Hud({ state, p, ticks, opponent }: { state: GameState; p: PlayerState; ticks: Record<string, number>; opponent?: boolean }) {
  const params = state.ruleset.params;
  return <div className={`hud${p.id === state.activePlayer ? ' hud--active' : ''}`} aria-label={`${p.name} status`}>
    <span className="hud__who">
      <strong>{p.name}</strong>
      <span className="hud__ap" role="img" aria-label={`${p.ap} AP left`}>
        {Array.from({ length: Math.max(params.apPerTurn, p.ap) }, (_, i) => <span key={i} className={i < p.ap ? 'on' : ''} />)}
      </span>
    </span>
    <span className="hud__pools">{NUTRIENTS.map(n => {
      const target = n === 'O2' ? undefined : params.winThreshold[n];
      const tick = ticks[`${p.id}-${n}`] ?? 0;
      const label = n === 'O2' ? 'O₂' : n;
      return <span key={`${n}-${tick}`} className={`pool pool--${n}${tick ? ' pool--tick' : ''}`}
        title={target === undefined ? `${label} ${p.pool[n]}` : `${label} ${p.pool[n]} of ${target} to win`}
        style={target === undefined ? undefined : { '--pct': `${Math.min(100, (p.pool[n] / (target || 1)) * 100)}%` } as CSSProperties}>
        <img src={art(n.toLowerCase())} alt={label} /><b>{p.pool[n]}</b>{target !== undefined && <small>/{target}</small>}
      </span>;
    })}</span>
    <span className="hud__piles">
      <span title="Deck"><img src={art('card-back')} alt="Deck" />{p.deck.length}</span>
      {opponent && <span title="Hand">✋{p.hand.length}</span>}
      <span title="Discard">🗑{p.discard.length}</span>
    </span>
  </div>;
}

/** A row of cards sized from the row's own box (see game.css "Card sizing"). */
function Zone({ className, label, cards, render, empty }: {
  className: string; label: string; cards: CardInstance[]; render: (c: CardInstance) => ReactNode; empty?: string;
}) {
  const side = cards.filter(isSideways).length;
  const vars = { '--n': Math.max(cards.length, 1), '--n-side': side, '--n-up': cards.length - side } as CSSProperties;
  return <section className={`zone ${className}`} aria-label={label} style={vars}>
    <div className="zone__row">{cards.map(render)}</div>
    {!cards.length && empty && <p className="zone__empty">{empty}</p>}
  </section>;
}

/** Hotseat board. The viewing player's side is at the bottom; their hand mounts only after they accept the device.
 *  Tap a card for its closeup; targeted actions then pick a highlighted card on the board. */
export function GameScreen({ ruleset }: { ruleset: Ruleset }) {
  const game = useGame(ruleset);
  const { state } = game;
  const [revealedTurn, setRevealedTurn] = useState('');
  const [seed, setSeed] = useState('');
  const [dismissedError, setDismissedError] = useState<GameState | null>(null);
  const [closeup, setCloseup] = useState<{ turn: string; uid: string } | null>(null);
  const [targeting, setTargeting] = useState<{ turn: string; kind: TargetKind; source: string } | null>(null);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [hint, setHint] = useState<{ text: string; at: number } | null>(null);
  const ticks = usePoolTicks(state.players);

  const player = state.activePlayer;
  const turn = `${state.round}-${state.activePlayer}-${player}`;
  const over = state.phase === 'gameOver';
  const covered = revealedTurn !== turn && !over;
  const me = state.players[player];
  const them = state.players[player === 0 ? 1 : 0];
  const aim = !covered && targeting?.turn === turn && state.cards[targeting.source] ? targeting : null;
  const valid = aim ? validTargets(state, aim.kind, player, aim.source) : [];
  const open = !covered && closeup?.turn === turn && state.cards[closeup.uid] ? closeup.uid : '';
  const name = (uid: string) => defOf(state, state.cards[uid]).name;
  const last = state.log[state.log.length - 1];

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 2600);
    return () => window.clearTimeout(t);
  }, [hint]);
  useEffect(() => {
    if (!aim || open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTargeting(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [!!aim, !!open]);

  const dispatch = (action: Action) => {
    setDismissedError(null); setHint(null); setCloseup(null); setTargeting(null);
    game.dispatch(action);
  };
  const startTargeting = (kind: TargetKind, source: string) => { setCloseup(null); setTargeting({ turn, kind, source }); };
  const inspect = (c: CardInstance) => setCloseup({ turn, uid: c.uid });
  const tap = (c: CardInstance) => {
    if (aim) {
      if (c.uid === aim.source) return setTargeting(null);
      if (c.zone === 'hand') { setTargeting(null); return inspect(c); }
      const action = targetedAction(aim.kind, player, aim.source, c.uid);
      const reason = checkAction(state, action);
      return reason ? setHint({ text: `${name(c.uid)}: ${reason}`, at: Date.now() }) : dispatch(action);
    }
    inspect(c);
  };
  const markOf = (c: CardInstance): Mark => {
    if (aim) return c.uid === aim.source ? 'source' : valid.includes(c.uid) ? 'target' : 'dim';
    return open === c.uid ? 'source' : undefined;
  };
  const card = (c: CardInstance) => <BoardCard key={c.uid} card={c} state={state} mark={markOf(c)} onTap={() => tap(c)} onInspect={() => inspect(c)} />;
  const fieldOf = (p: PlayerState) => Object.values(state.cards).filter(c => c.zone === 'field' && c.owner === p.id);
  const startNewGame = () => {
    game.newGame(seed === '' ? undefined : Number(seed));
    setRevealedTurn(''); setCloseup(null); setTargeting(null); setDrawer(null);
  };

  // While the board waits for a tap, the prompt takes over the bottom bar, so Cancel sits where End turn was.
  let prompt: ReactNode;
  if (aim) {
    prompt = <div className="prompt prompt--aim" role="status">
      <p><b>{TARGET_VERB[aim.kind]} · {name(aim.source)}</b> {targetPrompt(state, aim.kind, aim.source)} ({valid.length} lit)</p>
      <button type="button" className="btn" onClick={() => setTargeting(null)}>Cancel</button>
    </div>;
  }

  return <section className="game" aria-label="Match">
    <h1 className="sr-only">envi-tcg Playtest Simulator</h1>
    <header className="bar bar--top">
      <button type="button" className="icon-btn" aria-label="Menu" onClick={() => setDrawer('match')}>☰</button>
      <button type="button" className="icon-btn" aria-label="Undo" title="Undo" disabled={!game.canUndo} onClick={game.undo}>↶</button>
      <Hud state={state} p={them} ticks={ticks} opponent />
    </header>

    <Zone className="zone--field zone--opponent" label={`${them.name} field`} cards={fieldOf(them)} render={card} empty={`${them.name}: no organisms in play`} />

    <div className="center">
      <div className="center__status turn">
        <p><b>Round {state.round}</b><span>{over ? 'Game over' : `${state.players[state.activePlayer].name}'s turn`}</span></p>
      </div>
      <button type="button" className="center__log" onClick={() => setDrawer('log')} aria-label="Open the log">
        {state.modifiers.length > 0 && <span className="center__mods">⚡ {state.modifiers.length} effect{state.modifiers.length === 1 ? '' : 's'}</span>}
        <span className="center__last">{last ? logText(last) : 'Log'}</span>
      </button>
    </div>

    <Zone className="zone--field zone--mine" label={`${me.name} field`} cards={fieldOf(me)} render={card} empty="No organisms in play yet. Tap a card in your hand to play it." />

    <footer className="bar bar--bottom">
      {prompt ?? <Hud state={state} p={me} ticks={ticks} />}
      {!covered && !over && !prompt && <ActionButton state={state} action={{ type: 'endTurn', player: state.activePlayer }} dispatch={dispatch} className="act--end">End turn</ActionButton>}
    </footer>

    {over
      ? <div className="zone zone--hand game-over" role="status">
        <h2>{state.winner === 'draw' ? 'Draw: both players reached the threshold' : `${state.players[state.winner as 0 | 1].name} wins!`}</h2>
        <p><button type="button" className="btn" onClick={() => setDrawer('log')}>Review log</button> <button type="button" className="btn btn--primary" onClick={() => setDrawer('match')}>New game…</button></p>
      </div>
      : <Zone className="zone--hand" label={`${me.name} hand`} cards={covered ? [] : me.hand.map(uid => state.cards[uid])} render={card} empty={covered ? undefined : 'Your hand is empty.'} />}

    {!covered && ((state.lastError && dismissedError !== state) || hint) && <div className="toast" role="alert">
      <span>{hint?.text ?? state.lastError}</span>
      <button type="button" className="btn" onClick={() => { setHint(null); setDismissedError(state); }}>OK</button>
    </div>}

    {covered && <div className="pass-device" role="dialog" aria-modal="true" aria-labelledby="pass-title">
      <img src={art('card-back')} alt="" className="pass-device__emblem" />
      <h2 id="pass-title">Pass the device to {me.name}</h2>
      <p>Hands stay hidden between hotseat turns. Continue when {me.name} has the screen.</p>
      <button type="button" className="btn btn--primary" autoFocus onClick={() => setRevealedTurn(turn)}>I'm {me.name}: reveal my hand</button>
      {game.canUndo && <button type="button" className="btn" onClick={game.undo}>Undo last action</button>}
    </div>}

    {open && <CardCloseup
      state={state} uid={open} player={player} dispatch={dispatch}
      pickTarget={aim && valid.includes(open) ? { label: `Choose as target for ${name(aim.source)}`, pick: () => dispatch(targetedAction(aim.kind, player, aim.source, open)) } : undefined}
      onTarget={kind => startTargeting(kind, open)}
      onOpen={uid => setCloseup({ turn, uid })}
      onClose={() => setCloseup(null)} />}

    {drawer && <Sheet label="Game menu" drawer onClose={() => setDrawer(null)}>
      <nav className="tabs" aria-label="Menu sections">
        {DRAWER_TABS.map(([id, label]) => <button key={id} type="button" className="tabs__tab" aria-pressed={drawer === id} onClick={() => setDrawer(id)}>{label}</button>)}
      </nav>
      {drawer === 'match' && <div className="drawer__body">
        <section>
          <h3>Round {state.round}</h3>
          <p className="muted">Ruleset “{state.ruleset.name}” · seed {state.seed}</p>
          <div className="row">
            <button type="button" className="btn" disabled={!game.canUndo} title={state.ruleset.params.undoEnabled ? undefined : 'Undo is disabled in this ruleset'} onClick={game.undo}>↶ Undo</button>
            <button type="button" className="btn" disabled={!game.canRedo} onClick={game.redo}>↷ Redo</button>
          </div>
        </section>
        <section>
          <h3>Environmental effects</h3>
          {state.modifiers.length ? <ul className="mods">{state.modifiers.map((m, i) => <li key={`${m.id}-${i}`}>
            <strong>{state.ruleset.cards.find(d => d.id === m.source)?.name ?? m.source}</strong>: {m.effect}
            {m.activeRound !== undefined ? ` (round ${m.activeRound})` : ''}{m.player !== undefined ? ` · ${state.players[m.player].name}` : ' · both players'}
          </li>)}</ul> : <p className="muted">None active or queued.</p>}
        </section>
        <section>
          <h3>New game</h3>
          <p className="muted">Starts a fresh match with {ruleset.name}; the current match is replaced.</p>
          <div className="row">
            <label>Seed (optional)<input type="number" value={seed} onChange={e => setSeed(e.target.value)} /></label>
            <button type="button" className="btn btn--primary" onClick={startNewGame}>Start new game</button>
          </div>
        </section>
        <section>
          <h3>Other screens</h3>
          <div className="row">
            <a className="btn" href="#editor" onClick={() => setDrawer(null)}>Ruleset editor</a>
            <a className="btn" href="#interpretations" onClick={() => setDrawer(null)}>Interpretations</a>
          </div>
        </section>
      </div>}
      {drawer === 'log' && <div className="drawer__body">
        <h3>Field journal · {state.log.length} entries</h3>
        <ol className="log" reversed>{[...state.log].reverse().map((entry, i) =>
          <li key={state.log.length - i}><span className="log__round">R{entry.round}</span> {logText(entry)}</li>)}</ol>
      </div>}
      {drawer === 'referee' && <div className="drawer__body"><RefereePanel state={state} dispatch={dispatch} /></div>}
    </Sheet>}
  </section>;
}
