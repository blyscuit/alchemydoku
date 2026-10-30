import { useSyncExternalStore } from 'react';
import { getLittleAlchemy, subscribeSettings } from '@shared/utils/settings';

/** True while the "Little Alchemy" artwork set is enabled in Settings. */
export function useLittleAlchemy(): boolean {
  return useSyncExternalStore(subscribeSettings, getLittleAlchemy, () => false);
}
