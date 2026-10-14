import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { MdbStatus } from "../App";
import key_config from "../config/KeyConfig";

// How long after a +/- press an incoming sugar change still counts as
// user-driven. A machine-side reset arrives with no preceding press, so it
// falls outside this window and won't overwrite the customer's chosen level.
const SUGAR_PRESS_WINDOW_MS = 500;

// After the dispense click, how long to wait for the machine to start brewing
// (progress bar → `loading`). Brewing starting means the dispense registered and
// the vend is going through, so we finalize on it. If it doesn't move within
// this window, treat the press as not registered and don't finalize.
const MOVE_TIMEOUT_MS = 30000;

type CallApi = (
  endpoint: string,
  params?: Record<string, string | number | boolean>,
) => Promise<unknown>;

type WaitForStatus = (
  predicate: (status: MdbStatus | null) => boolean,
  timeout?: number,
  shouldAbort?: () => boolean,
) => Promise<void>;

interface VendCoffee {
  servId: string | number;
  price: number;
}

interface UseVendFlowParams {
  callApi: CallApi;
  clickButton: (servId: string | number) => Promise<unknown>;
  waitForStatus: WaitForStatus;
  /** Shared with App's session auto-reopen effect to avoid stacking session ops. */
  sessionBusy: MutableRefObject<boolean>;
  /** Set to the dispensed servId so useMdbSession reports it complete to statservice. */
  lastProductRef: MutableRefObject<string | number | null>;
  tech: boolean;
  coffeeList: VendCoffee[];
  status: MdbStatus | null;
  sugar: number;
  /** Interpreter's brewing/progress flag — true once the machine starts making the drink. */
  loading: boolean;
}

/**
 * Drives the customer vend flow: request → wait for payment approval → dispense,
 * plus the manual and idle-timeout cancel paths. Keeps the session-cancel races
 * in one place (see vendApprovedRef / cancelRequestedRef below).
 */
export function useVendFlow({
  callApi,
  clickButton,
  waitForStatus,
  sessionBusy,
  lastProductRef,
  tech,
  coffeeList,
  status,
  sugar,
  loading,
}: UseVendFlowParams) {
  const [cancelling, setCancelling] = useState(false);
  // Seconds left before an idle order auto-cancels (null = no countdown running)
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
  // Index of the coffee with an in-progress vend request (highlighted; blocks others)
  const [activeVendIndex, setActiveVendIndex] = useState<number | null>(null);

  // Set true while a cancel is in flight so a pending vend-approval wait aborts early
  const cancelRequestedRef = useRef(false);
  // Set true once a vend has been approved, so the idle countdown can't re-arm
  // during dispensing when the hardware flips vend_approved back to false
  const vendApprovedRef = useRef(false);

  // Live sugar reported by the machine (may be reset to default mid-vend).
  const sugarRef = useRef(sugar);
  // The sugar level the customer actually wants — re-asserted right before
  // dispense in case the machine reset it during the payment wait. Mirrored to
  // `effectiveSugar` so the UI holds the chosen value instead of showing the reset.
  const lastUserSugarRef = useRef(sugar);
  const [effectiveSugar, setEffectiveSugar] = useState(sugar);
  // Timestamp of the last +/- press, used to tell user intent from a reset.
  const lastSugarPressRef = useRef(0);

  // Live brewing/progress flag from the interpreter — true once the machine
  // starts making the drink. This is how we know the dispense actually
  // registered (the machine "moved") vs. a click that never took.
  const loadingRef = useRef(loading);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Poll an interpreter flag (tracked via ref) until it turns true or the
  // timeout elapses. Resolves true only if the flag was actually seen set, so
  // the caller can avoid finalizing a vend that didn't happen. Resolves
  // immediately if the flag is already set.
  function waitForFlag(
    getFlag: () => boolean,
    timeout: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (getFlag()) return resolve(true);
      const start = Date.now();
      const interval = setInterval(() => {
        if (getFlag()) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    });
  }

  useEffect(() => {
    sugarRef.current = sugar;
    // While idle, mirror whatever the machine reports as the baseline (handles a
    // non-zero default). Once a vend is in progress, only accept changes that
    // follow a real press, so a mid-vend reset can't clobber the customer's
    // choice — and the displayed value stays put through the reset.
    if (
      activeVendIndex === null ||
      Date.now() - lastSugarPressRef.current < SUGAR_PRESS_WINDOW_MS
    ) {
      lastUserSugarRef.current = sugar;
      setEffectiveSugar(sugar);
    }
  }, [sugar, activeVendIndex]);

  // Forwards a sugar +/- press to the machine and records it as user intent.
  // App wires this to the sugar panel in place of the raw clickButton.
  function adjustSugar(servId: string | number) {
    lastSugarPressRef.current = Date.now();
    return clickButton(servId);
  }

  // Drive the machine back to the customer's chosen sugar with +/- clicks. A
  // no-op (delta 0) on machines that don't reset, so it's safe to always run.
  async function reapplySugar() {
    const delta = lastUserSugarRef.current - sugarRef.current;
    if (delta === 0) return;
    const servId = delta > 0 ? key_config.plus : key_config.minus;
    for (let i = 0; i < Math.abs(delta); i++) {
      await clickButton(servId);
    }
  }

  async function handleProduct(index: number) {
    // Tech mode: skip the MDB/payment flow entirely, just dispense the drink
    if (tech) {
      lastProductRef.current = coffeeList[index].servId;
      clickButton(coffeeList[index].servId);
      return;
    }
    if (activeVendIndex !== null) return; // a vend is already in progress
    setActiveVendIndex(index);
    try {
      await callApi("vendRequest", {
        price: coffeeList[index].price,
        itemNumber: index,
      });

      // Wait until vend is approved (up to 2 min for customer to insert payment),
      // bailing immediately if the customer presses cancel
      await waitForStatus(
        (s) => !!s?.vend_approved,
        120000,
        () => cancelRequestedRef.current,
      );
      vendApprovedRef.current = true; // approved: stop the idle countdown from re-arming

      // Some machines reset sugar to default during the payment wait; re-assert
      // the customer's chosen level immediately before dispensing.
      await reapplySugar();

      // Record which product is being dispensed so the ready-driven statservice
      // report (in useMdbSession) fires for it. Set right before the dispense
      // click so it isn't left pointing at a sugar +/- press.
      lastProductRef.current = coffeeList[index].servId;
      await clickButton(coffeeList[index].servId);

      // Confirm the dispense actually registered before finalizing. A real
      // dispense makes the machine start brewing (progress bar → `loading`) —
      // once it's brewing the vend is going through, so we finalize right away.
      // If it doesn't move within the window the press likely didn't take:
      // don't finalize, leaving the session open.
      const moved = await waitForFlag(() => loadingRef.current, MOVE_TIMEOUT_MS);
      if (moved) {
        await callApi("vendSuccess", { itemNumber: index });
        await callApi("sessionClose");

        await waitForStatus((s) => !s?.session_is_open, 120000);

        await callApi("sessionOpen");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Cancelled") {
        // cancelOrder owns the session close/reopen; just release the lock
        console.log("Vend cancelled by user");
        
      } else {
        console.error("Vend flow failed:", err);
        await callApi("sessionClose");
        await callApi("sessionOpen");
      }
    } finally {
      vendApprovedRef.current = false;
      setActiveVendIndex(null);
      setCancelCountdown(null); // stop the idle countdown if it was running
  
    }
  }

  async function cancelOrder(): Promise<void> {
    // Once a vend is approved, handleProduct owns the session teardown; a cancel
    // here would race its sessionClose/sessionOpen, so bail out.
    if (vendApprovedRef.current) return;
    if (sessionBusy.current) return; // don't stack with auto-reopen / double-clicks
    sessionBusy.current = true;
    cancelRequestedRef.current = true; // abort any pending vend-approval wait
    setCancelling(true);
    try {
      await callApi("sessionClose");
      await waitForStatus((s) => !s?.session_is_open, 20000);
    } catch (err) {
      console.error("cancelOrder: session did not close in time", err);
    } finally {
      await callApi("sessionOpen"); // always reopen, even on timeout
      cancelRequestedRef.current = false;
      sessionBusy.current = false;
      setCancelling(false);
    }
  }

  // Auto-cancel an order after 20s of inactivity, so the machine doesn't sit
  // holding a session when a customer walks away. Mirrors the manual "Anuluj
  // zakup" button. The countdown resets whenever something changes (e.g. more
  // money inserted or sugar adjusted); it's skipped once the vend is approved
  // (it's dispensing). `cancelCountdown` drives the seconds shown on the button.
  // Counted in tenths of a second (ticks at 100ms) to avoid float drift.
  useEffect(() => {
    if (
      activeVendIndex === null ||
      status?.vend_approved ||
      vendApprovedRef.current
    ) {
      setCancelCountdown(null);
      return;
    }
    let tenths = 200; // 20s
    setCancelCountdown(tenths / 10);
    const interval = setInterval(() => {
      tenths -= 1;
      setCancelCountdown(tenths / 10);
      if (tenths <= 0) {
        clearInterval(interval);
        console.log("Order auto-cancelled after 20s of inactivity");
        cancelOrder();
      }
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVendIndex, status?.vend_approved, status?.funds_available, sugar]);

  return {
    activeVendIndex,
    cancelling,
    cancelCountdown,
    handleProduct,
    cancelOrder,
    adjustSugar,
    effectiveSugar,
  };
}
