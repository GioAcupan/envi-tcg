import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { CardDef, Nutrient, Params, Ruleset } from '../../engine';
import { defaultRuleset, exportRuleset, importRuleset } from '../../ruleset';
import './editor.css';

const DECK_SIZE = 40;
const NUTRIENTS: Nutrient[] = ['C', 'N', 'P', 'O2'];

/** Copy of `obj` with `key` set, or without `key` when value is undefined. Never mutates `obj`. */
function withField<T extends object>(obj: T, key: string, value: unknown): T {
  const copy: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  if (value === undefined) delete copy[key];
  else copy[key] = value;
  return copy as T;
}

function parseList(text: string): string[] {
  return text.split(',').map(item => item.trim()).filter(Boolean);
}

function storageAvailable(): boolean {
  try {
    localStorage.setItem('envi-tcg.probe', '1');
    localStorage.removeItem('envi-tcg.probe');
    return true;
  } catch {
    return false;
  }
}

function fileBaseName(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'ruleset';
}

/** Number input: empty means undefined (optional field) or 0 (required field). */
function NumberInput({ label, value, required, onChange }: {
  label: string; value: number | undefined; required?: boolean; onChange: (value: number | undefined) => void;
}) {
  return <input aria-label={label} type="number" value={value ?? ''} onChange={event => {
    const next = event.target.value === '' ? undefined : Number(event.target.value);
    onChange(required ? next ?? 0 : next);
  }} />;
}

/** Comma-separated list. Keeps its own draft text so typing a comma is not swallowed; re-syncs when the list changes from outside. */
function ListInput({ label, value, onChange }: { label: string; value: string[] | undefined; onChange: (list: string[]) => void }) {
  const list = value ?? [];
  const key = list.join('\n');
  const [draft, setDraft] = useState(list.join(', '));
  useEffect(() => {
    setDraft(current => parseList(current).join('\n') === key ? current : key.split('\n').join(', '));
  }, [key]);
  return <input aria-label={label} value={draft} onChange={event => {
    setDraft(event.target.value);
    onChange(parseList(event.target.value));
  }} />;
}

export function EditorScreen({ ruleset, onChange }: { ruleset: Ruleset; onChange: (ruleset: Ruleset) => void }) {
  const [canSave] = useState(storageAvailable);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { params } = ruleset;
  const deckTotal = ruleset.cards.reduce((sum, card) => sum + card.copies, 0);

  const setCard = (index: number, next: CardDef) =>
    onChange({ ...ruleset, cards: ruleset.cards.map((card, i) => (i === index ? next : card)) });
  const setParams = (patch: Partial<Params>) => onChange({ ...ruleset, params: { ...params, ...patch } });

  function exportFile() {
    const url = URL.createObjectURL(new Blob([exportRuleset(ruleset)], { type: 'application/json' }));
    const fileName = `${fileBaseName(ruleset.name)}.envi-tcg.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ kind: 'ok', text: `Exported ${fileName}.` });
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage({ kind: 'error', text: `Could not read ${file.name}.` });
      return;
    }
    const result = importRuleset(text);
    if (result.ok) {
      onChange(result.ruleset);
      setMessage({ kind: 'ok', text: `Imported "${result.ruleset.name}".` });
    } else {
      setMessage({ kind: 'error', text: `Import failed: ${result.error}. The current ruleset is unchanged.` });
    }
  }

  function resetToDefaults() {
    if (!window.confirm('Reset every card and parameter to the built-in defaults? Your current edits will be replaced.')) return;
    onChange(defaultRuleset());
    setMessage({ kind: 'ok', text: 'Reset to the built-in defaults.' });
  }

  return <section className="editor">
    <div className="editor-header">
      <h2>Ruleset editor</h2>
      <p className="editor-banner">Changes apply when you start a new game.</p>
    </div>
    {!canSave && <p className="editor-storage-warning">Changes won't be saved in this browser — export to keep them.</p>}

    <div className="editor-toolbar">
      <label className="editor-field editor-field--name">
        <span>Ruleset name</span>
        <input value={ruleset.name} onChange={event => onChange({ ...ruleset, name: event.target.value })} />
      </label>
      <div className="editor-buttons">
        <button type="button" onClick={exportFile}>Export</button>
        <button type="button" onClick={() => fileInput.current?.click()}>Import</button>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importFile} />
        <button type="button" className="editor-btn-reset" onClick={resetToDefaults}>Reset to defaults</button>
      </div>
      <p className="editor-deck" aria-live="polite">
        Deck total: <strong>{deckTotal}</strong> cards
        {deckTotal !== DECK_SIZE && <span className="editor-hint"> (decks are usually {DECK_SIZE} cards)</span>}
      </p>
    </div>
    {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`editor-message editor-message-${message.kind}`}>{message.text}</p>}

    <h3>Parameters</h3>
    <div className="editor-params">
      {([
        ['startingHand', 'Starting hand'], ['apPerTurn', 'AP per turn'], ['drawPerRound', 'Draw per round'],
        ['playApCost', 'Play AP cost'], ['discardDrawApCost', 'Discard and draw AP cost'], ['eatApCost', 'Eat AP cost'],
        ['maxEatsPerRound', 'Max eats per round'], ['detritivoreAssignApCost', 'Detritivore assign AP cost'],
        ['algalBloomPThreshold', 'Algal Bloom P threshold'],
      ] as [keyof Params, string][]).map(([key, label]) => (
        <label key={key} className="editor-field">
          <span>{label}</span>
          <NumberInput label={label} required value={params[key] as number}
            onChange={value => setParams({ [key]: value } as Partial<Params>)} />
        </label>
      ))}

      <fieldset className="editor-group">
        <legend>Starting pool</legend>
        {NUTRIENTS.map(nutrient => (
          <label key={nutrient} className="editor-field">
            <span>{nutrient}</span>
            <NumberInput label={`Starting pool ${nutrient}`} required value={params.startingPool[nutrient]}
              onChange={value => setParams({ startingPool: withField(params.startingPool, nutrient, value) })} />
          </label>
        ))}
      </fieldset>

      <fieldset className="editor-group">
        <legend>Win threshold</legend>
        {(['C', 'N', 'P'] as const).map(nutrient => (
          <label key={nutrient} className="editor-field">
            <span>{nutrient}</span>
            <NumberInput label={`Win threshold ${nutrient}`} required value={params.winThreshold[nutrient]}
              onChange={value => setParams({ winThreshold: withField(params.winThreshold, nutrient, value) })} />
          </label>
        ))}
      </fieldset>


      <label className="editor-check">
        <input type="checkbox" checked={params.firstPlayerAlternates}
          onChange={event => setParams({ firstPlayerAlternates: event.target.checked })} />
        First player alternates each round
      </label>
      <label className="editor-check">
        <input type="checkbox" checked={params.undoEnabled}
          onChange={event => setParams({ undoEnabled: event.target.checked })} />
        Undo enabled
      </label>
    </div>

    <h3>Cards ({ruleset.cards.length} archetypes)</h3>
    <div className="editor-table-wrap">
      <table className="editor-table">
        <thead>
          <tr>
            <th>Name</th><th>Kind</th><th>Subtype</th><th>Cost C</th><th>Cost N</th>
            <th>O₂ produced</th><th>O₂ per round</th><th>Lifespan</th><th>Tags</th><th>Can eat</th><th>Copies</th><th>Text</th>
          </tr>
        </thead>
        <tbody>
          {ruleset.cards.map((card, index) => {
            const row = `(card ${index + 1})`;
            const set = (next: CardDef) => setCard(index, next);
            return <tr key={index} className={`editor-row editor-row--${card.kind}`}>
              <td><input aria-label={`Name ${row}`} value={card.name} onChange={event => set({ ...card, name: event.target.value })} /></td>
              <td className="editor-kind"><span className={`editor-kind-pill editor-kind-pill--${card.kind}`}>{card.kind}</span></td>
              <td><input aria-label={`Subtype ${row}`} value={card.subtype ?? ''}
                onChange={event => set(withField(card, 'subtype', event.target.value || undefined))} /></td>
              <td><NumberInput label={`Cost C ${row}`} required value={card.cost.C}
                onChange={value => set({ ...card, cost: withField(card.cost, 'C', value) })} /></td>
              <td><NumberInput label={`Cost N ${row}`} required value={card.cost.N}
                onChange={value => set({ ...card, cost: withField(card.cost, 'N', value) })} /></td>
              <td><NumberInput label={`O2 per round ${row}`} value={card.o2PerRound}
                onChange={value => set(withField(card, 'o2PerRound', value))} /></td>
              <td><NumberInput label={`Lifespan ${row}`} value={card.lifespan}
                onChange={value => set(withField(card, 'lifespan', value))} /></td>
              <td><ListInput label={`Tags ${row}`} value={card.tags}
                onChange={list => set({ ...card, tags: list })} /></td>
              <td><ListInput label={`Can eat ${row}`} value={card.canEat}
                onChange={list => set(withField(card, 'canEat', list.length ? list : undefined))} /></td>
              <td><NumberInput label={`Copies ${row}`} required value={card.copies}
                onChange={value => set({ ...card, copies: value ?? 0 })} /></td>
              <td><textarea aria-label={`Text ${row}`} rows={2} value={card.text}
                onChange={event => set({ ...card, text: event.target.value })} /></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </section>;
}
