import { useSyncExternalStore } from 'react';

/** Minimal external store shared by a lab page and the workshop presenter. */
export interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (fn: () => void) => () => void;
  reset: () => void;
}

export function createStore<T>(initial: () => T): Store<T> {
  let state = initial();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => state,
    set: (next) => {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      emit();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reset: () => {
      state = initial();
      emit();
    },
  };
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
