import { useEffect, useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";

/**
 * Shows a timeout screen after 2 min of inactivity (unless the timeout is
 * suppressed — e.g. credit is held or a price is shown, meaning a customer is
 * mid-transaction), then auto-resumes after a further 1 min. Returns the
 * timeout flag plus the setter/clear helpers that the sugar panel still drives
 * directly.
 */
export function useIdleScreen(suppressTimeout: boolean) {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const autoResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoResumeTimer = () => {
    if (autoResumeTimeout.current) {
      clearTimeout(autoResumeTimeout.current);
      autoResumeTimeout.current = null;
    }
  };

  const idleTimer = useIdleTimer({
    timeout: 1000 * 120, // 2 minutes
    debounce: 500,
    onIdle: () => {
      if (!suppressTimeout) {
        console.log("User idle — showing timeout screen");
        setIsTimedOut(true);

        // Start timer to auto-resume after 1 minute
        clearAutoResumeTimer();
        autoResumeTimeout.current = setTimeout(() => {
          console.log("Auto-resume triggered after 1 minute");
          setIsTimedOut(false);
        }, 1000 * 60); // 1 minute
      } else {
        console.log("Idle ignored — credit held or price shown");
      }
    },
    onActive: () => {
      console.log("User became active — hiding timeout screen");
      setIsTimedOut(false);
      clearAutoResumeTimer();
    },
  });

  // React to the transaction state changing outside of DOM activity. Credit is
  // inserted/cleared via MDB, not mouse/keyboard, so react-idle-timer's
  // onActive/onIdle never fire for it — we drive the timer ourselves.
  const wasSuppressed = useRef(suppressTimeout);
  useEffect(() => {
    if (suppressTimeout && !wasSuppressed.current) {
      // Transaction became active: dismiss any showing screen.
      console.log("Timeout screen dismissed — credit held or price shown");
      setIsTimedOut(false);
      clearAutoResumeTimer();
    } else if (!suppressTimeout && wasSuppressed.current) {
      // Transaction cleared: the idle timer already fired onIdle while
      // suppressed and won't fire again on its own, so restart the countdown
      // from scratch to re-arm the timeout screen.
      console.log("Transaction cleared — re-arming idle timer");
      idleTimer.start();
    }
    wasSuppressed.current = suppressTimeout;
  }, [suppressTimeout, idleTimer]);

  // Clear the pending auto-resume timer on unmount
  useEffect(() => clearAutoResumeTimer, []);

  return { isTimedOut, setIsTimedOut, clearAutoResumeTimer };
}
