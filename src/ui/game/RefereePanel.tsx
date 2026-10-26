import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Action, GameState, PlayerId, Pool, RefereeOp, Status, Zone } from '../../engine';

/** Explicit, logged overrides for every engine referee operation; no rule logic lives here. */
export function RefereePanel({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [player, setPlayer] = useState<PlayerId>(0);
  const [uid, setUid] = useState('');
  const [privateCards, setPrivateCards] = useState(false);
  const card = state.cards[uid];
  const p = state.players[player];
  const op = (value: RefereeOp) => dispatch({ type: 'referee', op: value });
  const submit = (event: FormEvent<HTMLFormElement>, apply: (data: FormData) => void) => {
    event.preventDefault(); apply(new FormData(event.currentTarget));
  };
  const pool = (data: FormData): Pool => ({ C: Number(data.get('C')), N: Number(data.get('N')), P: Number(data.get('P')), O2: Number(data.get('O2')) });
  const poolInputs = (value: Pool) => (['C', 'N', 'P', 'O2'] as const).map(n => <label key={n}>{n}<input name={n} type="number" step="1" required defaultValue={value[n]} /></label>);
  return <section className="referee-panel" aria-label="Referee panel">
    <p>Overrides bypass rules, are recorded in the log, and can change the winner.</p>
    <label>Referee player<select aria-label="Referee player" value={player} onChange={e => setPlayer(Number(e.target.value) as PlayerId)}>{state.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <div className="referee-controls">
      <form key={`pool-${player}-${JSON.stringify(p.pool)}`} onSubmit={e => submit(e, data => op({ kind: 'setPool', player, pool: pool(data) }))}><fieldset><legend>Player nutrients</legend>{poolInputs(p.pool)}<button>Set pool</button></fieldset></form>
      <form key={`ap-${player}-${p.ap}`} onSubmit={e => submit(e, data => op({ kind: 'setAp', player, ap: Number(data.get('ap')) }))}><label>Action points<input type="number" name="ap" required defaultValue={p.ap} /></label><button>Set AP</button></form>
      <button type="button" onClick={() => op({ kind: 'draw', player })}>Draw for referee player</button>
      <button type="button" onClick={() => op({ kind: 'setActivePlayer', player })}>Make referee player active</button>
      <button type="button" onClick={() => op({ kind: 'endRound' })}>Force end round</button>
    </div>
    <label><input type="checkbox" checked={privateCards} onChange={e => setPrivateCards(e.target.checked)} />Reveal private cards for referee</label>
    <label>Referee card<select aria-label="Referee card" value={uid} onChange={e => setUid(e.target.value)}><option value="">Choose a card</option>{Object.values(state.cards).filter(c => privateCards || !['deck', 'hand'].includes(c.zone)).map(c => <option key={c.uid} value={c.uid}>{state.ruleset.cards.find(d => d.id === c.defId)?.name} · {c.uid} · {c.owner === null ? 'shared' : state.players[c.owner].name} · {c.zone}</option>)}</select></label>
    {card && <div className="referee-card-controls" key={`${uid}-${JSON.stringify(card)}`}>
      <form onSubmit={e => submit(e, data => op({ kind: 'setStatus', uid, status: data.get('status') as Status }))}><label>Status<select aria-label="Status" name="status" defaultValue={card.status ?? 'alive'}>{['alive', 'dead'].map(s => <option key={s}>{s}</option>)}</select></label><button>Set status</button></form>
      <form onSubmit={e => submit(e, data => op({ kind: 'moveCard', uid, zone: data.get('zone') as Zone, owner: Number(data.get('owner')) as PlayerId }))}>
        <label>Destination<select aria-label="Destination" name="zone" defaultValue={card.zone}>{['deck', 'hand', 'field', 'attached', 'discard', 'removed'].map(z => <option key={z}>{z}</option>)}</select></label>
        <label>Owner<select aria-label="Owner" name="owner" defaultValue={card.owner ?? 'shared'}>{state.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button>Move card</button>
      </form>
      {(['lifespanLeft', 'marks'] as const).map(field => <form key={field} onSubmit={e => submit(e, data => op({ kind: 'setCardField', uid, field, value: Number(data.get(field)) }))}><label>{field === 'lifespanLeft' ? 'Lifespan left' : 'Marks'}<input type="number" name={field} defaultValue={card[field] ?? 0} required /></label><button>Set {field === 'lifespanLeft' ? 'lifespan' : 'marks'}</button></form>)}
      <form onSubmit={e => submit(e, data => op({ kind: 'setCardField', uid, field: 'stored', value: pool(data) }))}><fieldset><legend>Stored nutrients</legend>{poolInputs(card.stored)}<button>Set stored nutrients</button></fieldset></form>
    </div>}
  </section>;
}
