import { interpretations, type Interpretation } from '../../data/interpretations';
import './interpretations.css';

function InterpretationList({ items }: { items: Interpretation[] }) {
  return <ul className="interp-list">
    {items.map(item => <li key={item.id} className="interp-item">
      <p className="interp-head"><span className="interp-id">{item.id}</span> <strong>{item.topic}</strong></p>
      <p className="interp-text">{item.text}</p>
    </li>)}
  </ul>;
}

/** Lists how the app reads each unclear rule; major questions come first for the rule authors. */
export function InterpretationsScreen() {
  const major = interpretations.filter(item => item.major);
  const others = interpretations.filter(item => !item.major);
  return <section className="interp">
    <h2>How the app reads the rules</h2>
    <p>Where the draft rules were unclear, the app made the choice below. Checkable against the PDF.</p>
    <h3>Questions for the rule authors</h3>
    <InterpretationList items={major} />
    <h3>Other inferences</h3>
    <InterpretationList items={others} />
  </section>;
}
