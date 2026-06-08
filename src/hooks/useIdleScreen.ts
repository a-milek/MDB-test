import { useEffect, useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";

/**
 * Shows a timeout screen after 2 min of inactivity (unless credit is active),
 * then auto-resumes after a further 1 min. Returns the timeout flag plus the
 * setter/clear helpers that the sugar panel still drives directly.
 */
export function useIdleScreen(hasCredit: boolean) {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const autoResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoResumeTimer = () => {
    if (autoResumeTimeout.current) {
      clearTimeout(autoResumeTimeout.current);
      autoResumeTimeout.current = null;
    }
  };

  useIdleTimer({
    timeout: 1000 * 120, // 2 minutes
    debounce: 500,
    onIdle: () => {
      if (!hasCredit) {
        console.log("User idle — showing timeout screen");
        setIsTimedOut(true);

        // Start timer to auto-resume after 1 minute
        clearAutoResumeTimer();
        autoResumeTimeout.current = setTimeout(() => {
          console.log("Auto-resume triggered after 1 minute");
          setIsTimedOut(false);
        }, 1000 * 60); // 1 minute
      } else {
        console.log("Idle ignored — 'Kredyt' is active");
      }
    },
    onActive: () => {
      console.log("User became active — hiding timeout screen");
      setIsTimedOut(false);
      clearAutoResumeTimer();
    },
  });

  // Clear the pending auto-resume timer on unmount
  useEffect(() => clearAutoResumeTimer, []);

  return { isTimedOut, setIsTimedOut, clearAutoResumeTimer };
}
