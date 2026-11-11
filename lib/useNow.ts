import { useEffect, useState } from "react";

// Current time, re-rendering the caller every `ms` until `until` (epoch ms) is reached, then it stops ticking.
// A later `until` (new set, longer target) starts it again. Only tickers use it.
export function useNow(ms = 1000, until = Infinity) {
  const [now, setNow] = useState(() => Date.now());
  const finished = now >= until;
  useEffect(() => {
    if (finished) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // on restart, don't show the stale stopped time for a whole interval
    const t = setInterval(tick, ms);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [ms, finished]);
  return now;
}
