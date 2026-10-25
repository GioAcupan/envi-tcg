import type { ReactNode } from 'react';
import { checkAction } from '../../engine';
import type { Action, GameState } from '../../engine';

/** A button for one engine action. When checkAction rejects it, the button is disabled and its reason
 *  is printed under it (visible on touch screens, not only on hover). */
export function ActionButton({ state, action, dispatch, children, className = '' }: {
  state: GameState; action: Action; dispatch: (action: Action) => void; children: ReactNode; className?: string;
}) {
  const reason = checkAction(state, action);
  return <span className={`act ${className}`}>
    <button type="button" className="btn" disabled={!!reason} title={reason ?? undefined} onClick={() => dispatch(action)}>{children}</button>
    {reason && <span className="act__reason">{reason}</span>}
  </span>;
}
