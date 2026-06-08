import { useCallback, useEffect, useRef, useState } from "react";
import { Box, useDisclosure, VisuallyHidden } from "@chakra-ui/react";
import CoffeeGrid from "./components/CoffeeGrid";
import OutOfOrderModal from "./components/OutOfOrderModal";
import { IntlProvider } from "react-intl";
import LanguageSwitcher from "./components/LanguageSwitcher";
import pl from "./locales/pl.json";
import en from "./locales/en.json";
import coffeeData from "./config/CoffeeData";
import LoadingScreen from "./components/LoadingScreen";
import SugarPanel from "./components/Sugar";
import TechKeyboard from "./components/TechKeyboard";
import TimeoutScreen from "./components/TimeoutScreen";
import { useVendFlow } from "./hooks/useVendFlow";
import { useReconnectingSocket } from "./hooks/useReconnectingSocket";
import { useIdleScreen } from "./hooks/useIdleScreen";
import { useMdbSession } from "./hooks/useMdbSession";

interface InterpretedState {
  out_of_order: boolean;
  tech: boolean;
  ready: boolean;
  sugar: number;
  remaining_lines: string[];
  loading: boolean;
  current_price: number | null;
}

export interface MdbStatus {
  is_error_state: boolean;
  is_service_state: boolean;
  is_insufficient_change: boolean;
  is_cash_only: boolean;
  is_card_only: boolean;
  is_notes_not_accepted: boolean;
  session_is_open: boolean;
  session_is_requested_to_cancel: boolean;
  vend_approved: boolean;
  item_price: number;
  funds_available: number;
}

const messages = { pl, en };

const LOCALES = {
  ENGLISH: "en",
  POLISH: "pl",
} as const;

type Locale = (typeof LOCALES)[keyof typeof LOCALES];

function App() {
  // --- UI & state control ---
  const [wsConnected, setWsConnected] = useState(false);
  const [lines, setLines] = useState<string[]>(["Oczekiwanie na dane"]);
  const [tech, setTech] = useState(false);
  const [outOfOrder, setOutOfOrder] = useState(false);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasCredit, setHasCredit] = useState(false);
  const [sugar, setSugar] = useState(0);
  const [status, setStatus] = useState<MdbStatus | null>(null);

  // --- Idle timeout screen ---
  const { isTimedOut, setIsTimedOut, clearAutoResumeTimer } =
    useIdleScreen(hasCredit);

  // --- Price & order control ---
  const [current, setCurrentPrice] = useState<number | null>(null);
  const currentPriceRef = useRef<number | null>(null);
  const getCurrentPrice = useCallback(() => currentPriceRef.current, []);
  useEffect(() => {
    currentPriceRef.current = current;
  }, [current]);

  // --- Coffee List ---
  const [coffeeList, setCoffeeList] = useState(() => {
    try {
      const stored = localStorage.getItem("coffee-prices");
      return stored ? JSON.parse(stored) : coffeeData;
    } catch {
      return coffeeData;
    }
  });
  useEffect(() => {
    localStorage.setItem("coffee-prices", JSON.stringify(coffeeList));
  }, [coffeeList]);

  // --- Prevent dragging images ---
  useEffect(() => {
    document
      .querySelectorAll("img")
      .forEach((img) => img.setAttribute("draggable", "false"));
  }, []);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [locale, setLocale] = useState<Locale>(LOCALES.POLISH);

  const { callApi, clickButton, waitForStatus, sessionBusy } = useMdbSession({
    status,
    setStatus,
    ready,
  });

  useEffect(() => {
    if (status?.is_error_state) {
      onOpen();
    } else {
      onClose();
    }
  }, [status, onOpen, onClose]);

  // MDB watch socket — drives the raw machine status
  useReconnectingSocket<{ type: string; data: MdbStatus }>(
    import.meta.env.VITE_MDB_WS_URL,
    {
      onOpen: () => console.log("Connected to MDB watch WS"),
      onClose: () => console.log("Disconnected from MDB watch WS"),
      onMessage: (payload) => {
        if (
          payload.type === "status_snapshot" ||
          payload.type === "status_changed"
        ) {
          setStatus(payload.data);
        }
      },
    },
  );

  // Interpreter socket — drives the friendly UI state (sugar, lines, tech, etc.)
  useReconnectingSocket<{ type: string; state: InterpretedState }>(
    import.meta.env.VITE_INTERPRETER_WS_URL,
    {
      onOpen: () => {
        console.log("Connected to interpreter WS (9000)");
        setWsConnected(true);
      },
      onClose: () => {
        console.log("Disconnected from interpreter WS");
        setWsConnected(false);
      },
      onMessage: (payload) => {
        if (payload.type === "interpreted_state") {
          const data = payload.state;
          setOutOfOrder(data.out_of_order);
          setTech(!!data.tech);
          setReady(!!data.ready);
          setSugar(data.sugar ?? 0);
          setLines(data.remaining_lines ?? []);
          setLoading(data.loading);
          setCurrentPrice(data.current_price ?? null);
        }
      },
    },
  );
  const {
    activeVendIndex,
    cancelling,
    cancelCountdown,
    handleProduct,
    cancelOrder,
  } = useVendFlow({
    callApi,
    clickButton,
    waitForStatus,
    sessionBusy,
    tech,
    coffeeList,
    status,
    sugar,
  });

  if (isTimedOut)
    return (
      <>
        <TimeoutScreen />
      </>
    );

  return (
    <>
      <IntlProvider
        messages={messages[locale]}
        locale={locale}
        defaultLocale={LOCALES.POLISH}
      >
        <OutOfOrderModal isOpen={isOpen} onClose={onClose} />

        <Box
          background={
            status?.is_service_state
              ? "#2596be"
              : status?.is_error_state || tech
                ? "red"
                : "black"
          }
          minH="100vh"
          minW="100vw"
          alignContent="center"
        >
          {!wsConnected && <p>Reconnecting...</p>}

          <LanguageSwitcher locale={locale} onChange={setLocale} />

          {loading || ready ? (
            <>
              <LoadingScreen ready={ready} />
              <VisuallyHidden>
                <SugarPanel
                  tech={tech}
                  status={status}
                  onClick={clickButton}
                  lines={lines}
                  setTech={setTech}
                  setReady={setReady}
                  setCurrentPrice={setCurrentPrice}
                  setLoading={setLoading}
                  setIsTimedOut={setIsTimedOut}
                  setHasCredit={setHasCredit}
                  clearAutoResumeTimer={clearAutoResumeTimer}
                  sugar={sugar}
                />
              </VisuallyHidden>
            </>
          ) : (
            <>
              <SugarPanel
                onClick={clickButton}
                lines={lines}
                setTech={setTech}
                outOfOrder={outOfOrder}
                setReady={setReady}
                setCurrentPrice={setCurrentPrice}
                setLoading={setLoading}
                tech={tech}
                setIsTimedOut={setIsTimedOut}
                setHasCredit={setHasCredit}
                clearAutoResumeTimer={clearAutoResumeTimer}
                status={status}
                sugar={sugar}
              />
              {tech && (
                <TechKeyboard
                  onClick={clickButton}
                  getCurrentPrice={getCurrentPrice}
                />
              )}

              <CoffeeGrid
                coffeeList={coffeeList}
                setCoffeeList={setCoffeeList}
                onClick={handleProduct}
                tech={tech}
                disabled={!tech && current !== null}
                activeIndex={activeVendIndex}
                cancelOrder={cancelOrder}
                cancelling={cancelling}
                cancelCountdown={cancelCountdown}
                hasFunds={(status?.funds_available ?? 0) > 0}
              />
            </>
          )}
        </Box>
      </IntlProvider>
    </>
  );
}

export default App;
