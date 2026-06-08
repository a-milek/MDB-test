import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { MdbStatus } from "../App";

interface UseMdbSessionParams {
  status: MdbStatus | null;
  setStatus: Dispatch<SetStateAction<MdbStatus | null>>;
  /** Drives the "report completion to statservice" effect. */
  ready: boolean;
}

/**
 * Owns the MDB/payservice HTTP layer: the `callApi` helper, the `waitForStatus`
 * poller, the dispense (`click_button`) call, completion reporting, and the
 * session auto-reopen effect that keeps a session live whenever the machine
 * isn't in an error/service state. Exposes the pieces the vend flow needs.
 */
export function useMdbSession({ status, setStatus, ready }: UseMdbSessionParams) {
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const sessionBusy = useRef(false);
  const lastProductRef = useRef<string | number | null>(null);
  const finishedRef = useRef(false);

  const callApi = async (
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ) => {
    console.log(endpoint);
    try {
      let url = `${import.meta.env.VITE_API_URL}/${endpoint}`;
      if (params) {
        const query = new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ).toString();
        url += `?${query}`;
      }
      const res = await fetch(url);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (endpoint === "getStatus") {
        setStatus(data.data);
      }
      return data.data;
    } catch (err) {
      console.error(`${endpoint} ERROR:`, err);
    }
  };

  function waitForStatus(
    predicate: (status: MdbStatus | null) => boolean,
    timeout = 10000,
    shouldAbort?: () => boolean,
  ) {
    return new Promise<void>((resolve, reject) => {
      const start = Date.now();

      const interval = setInterval(() => {
        const currentStatus = statusRef.current;

        if (shouldAbort?.()) {
          clearInterval(interval);
          reject(new Error("Cancelled"));
        } else if (predicate(currentStatus)) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("Timeout"));
        }
      }, 200);
    });
  }

  const click_button = async (servId: string | number) => {
    console.log("order start", servId);
    try {
      const res = await fetch("/vending-machines/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Order failed");
      }

      return await res.json();
    } catch (err) {
      console.error("Order error:", err);
      return null;
    }
  };

  const product_finished = async (product_id: string | number | null) => {
    if (product_id == null) return;

    console.log("called product_finished", product_id);

    try {
      const res = await fetch("/vending-machines/statservice/order_complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id }),
      });

      if (!res.ok) throw new Error("Statservice failed");
      return await res.json();
    } catch (err) {
      console.error("Statservice error:", err);
    }
  };

  // Report completion once the machine reports `ready` (guarded so it fires once)
  useEffect(() => {
    if (ready && lastProductRef.current != null && !finishedRef.current) {
      finishedRef.current = true;
      product_finished(lastProductRef.current);
    }

    if (!ready) {
      finishedRef.current = false;
    }
  }, [ready]);

  // Keep a payment session open whenever the machine is idle and able to take one
  useEffect(() => {
    if (!status || sessionBusy.current) return;
    if (status.is_error_state || status.is_service_state) return;

    const reopen = async (close: boolean) => {
      sessionBusy.current = true;
      try {
        if (close) await callApi("sessionClose");
        // sessionOpen can 500 on cold boot before the payservice is ready — retry
        for (let i = 0; i < 10; i++) {
          await callApi("sessionOpen");
          try {
            await waitForStatus((s) => !!s?.session_is_open, 3000);
            return;
          } catch {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      } finally {
        sessionBusy.current = false;
      }
    };

    if (status.session_is_requested_to_cancel) reopen(true);
    else if (!status.session_is_open) reopen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return { callApi, clickButton: click_button, waitForStatus, sessionBusy };
}
