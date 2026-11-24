import { useEffect, useRef, useState } from "react";

// Remote "Shift+F5": the Pi (WebControls/main.py) serves a token that changes
// when a new UI build is deployed, the server restarts, or someone calls
// `curl -X POST http://<pi>:8080/vending-machines/reload`. When it changes we
// reload the page — but only once the machine is idle, never mid-order.
const RELOAD_TOKEN_URL = `${import.meta.env.BASE_URL}reload-token`;
const POLL_INTERVAL_MS = 10000;

export function useRemoteReload(busy: boolean) {
  const initialToken = useRef<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let stopped = false;

    const check = async () => {
      try {
        const res = await fetch(RELOAD_TOKEN_URL, { cache: "no-store" });
        if (!res.ok) return;
        const { token } = (await res.json()) as { token?: string };
        if (!token || stopped) return;
        if (initialToken.current === null) initialToken.current = token;
        else if (token !== initialToken.current) setPending(true);
      } catch {
        // Server down or restarting — try again next tick
      }
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (pending && !busy) {
      console.log("Remote reload requested — reloading");
      window.location.reload();
    }
  }, [pending, busy]);
}
