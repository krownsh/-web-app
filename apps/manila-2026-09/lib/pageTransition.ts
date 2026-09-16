import { flushSync } from 'react-dom';
import type { NavigateFunction } from 'react-router-dom';

export function navigateWithTransition(navigate: NavigateFunction, to: string, _fromPath?: string) {
  try {
    const start = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition;
    if (!start) {
      navigate(to);
      return;
    }
    start(() => {
      flushSync(() => navigate(to));
    });
  } catch {
    navigate(to);
  }
}
