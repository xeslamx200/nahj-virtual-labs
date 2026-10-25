import { createStore, useStore } from './store';

/** Presentation mode enlarges text for a projector (workshop use). Not persisted. */
export const presentingStore = createStore<boolean>(() => false);
export const usePresenting = () => useStore(presentingStore);
export function setPresenting(on: boolean) {
  presentingStore.set(() => on);
  document.documentElement.classList.toggle('presenting', on);
}
