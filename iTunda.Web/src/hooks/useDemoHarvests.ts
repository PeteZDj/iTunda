import { useSyncExternalStore } from 'react';
import { buildRollingDemoHarvests, type DemoHarvest } from '../lib/demoHarvests';

const dayMs = 86_400_000;
let cachedDay = -1;
let harvests: DemoHarvest[] = [];

function snapshot() {
  const now = Date.now();
  const day = Math.floor(now / dayMs);
  if (day !== cachedDay) {
    cachedDay = day;
    harvests = buildRollingDemoHarvests(now);
  }
  return harvests;
}

function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  let current = snapshot();
  function refresh() {
    clearTimeout(timer);
    const next = snapshot();
    if (next !== current) {
      current = next;
      onChange();
    }
    // Refresh any open page at the same UTC boundary used to compute offers.
    timer = setTimeout(refresh, dayMs - Date.now() % dayMs + 25);
  }
  refresh();
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', refresh);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('focus', refresh);
    document.removeEventListener('visibilitychange', refresh);
  };
}

export function useDemoHarvests() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
