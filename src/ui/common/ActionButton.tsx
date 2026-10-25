import type { ReactNode } from 'react';
import { checkAction } from '../../engine';
import type { Action, GameState } from '../../engine';

/** Keeps the engine's legality reason available on hover and keyboard focus. */
export function ActionButton({ state, action, dispatch, children }: {
  state: GameState; action: Action; dispatch: (action: Action) => void; children: ReactNode;
}) {
  const reason = checkAction(state, action);
  return <span className="action-control" title={reason ?? undefined} tabIndex={reason ? 0 : undefined}>
    <button type="button" disabled={!!reason} title={reason ?? undefined} onClick={() => dispatch(action)}>{children}</button>
    {reason && <span className="action-reason" role="tooltip">{reason}</span>}
  </span>;
}
