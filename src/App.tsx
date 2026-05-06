import { useCallback, useEffect, useRef, useState } from "react";
import { Box, useDisclosure, VisuallyHidden } from "@chakra-ui/react";
import CoffeeGrid from "./components/CoffeeGrid";
// import Screen from "./components/Screen";
import OutOfOrderModal from "./components/OutOfOrderModal";
import { useIdleTimer } from "react-idle-timer";
// import TimeoutScreen from "./components/TimeoutScreen";
import { IntlProvider } from "react-intl";
import LanguageSwitcher from "./components/LanguageSwitcher";
import pl from "./locales/pl.json";
import en from "./locales/en.json";
import coffeeData from "./config/CoffeeData";
import LoadingScreen from "./components/LoadingScreen";
import SugarPanel from "./components/Sugar";
import TechKeyboard from "./components/TechKeyboard";
import TimeoutScreen from "./components/TimeoutScreen";

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
function App() {
  const autoResumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // --- UI & state control ---
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lines, setLines] = useState<string[]>(["Oczekiwanie na dane"]);
  const [tech, setTech] = useState(false);
  const [progress, setProgress] = useState(1);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasCredit, setHasCredit] = useState(false);
  const [sugar, setSugar] = useState(0);

  // --- Price & order control ---
  const [current, setCurrentPrice] = useState<number | null>(null);
  const currentPriceRef = useRef<number | null>(null);
  const getCurrentPrice = useCallback(() => currentPriceRef.current, []);
  useEffect(() => {
    currentPriceRef.current = current;
  }, [current]);
  const lastProductRef = useRef<string | number | null>(null);

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

  const [status, setStatus] = useState<MdbStatus | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  // const [presence, setPresence] = useState<boolean>(false);
  // const [distance, setDistance] = useState<number | null>(null);

  const messages = { pl, en };
  const LOCALES = {
    ENGLISH: "en" as const,
    POLISH: "pl" as const,
  };
  type Locale = (typeof LOCALES)[keyof typeof LOCALES];
  const [locale, setLocale] = useState<Locale>(LOCALES.POLISH);

  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  //  --- Idle Timer ---
  useIdleTimer({
    timeout: 1000 * 120, // 2 minutes
    debounce: 500,
    onIdle: () => {
      if (!hasCredit) {
        console.log("User idle — showing timeout screen");
        setIsTimedOut(true);

        // Start timer to auto-resume after 1 minute
        if (autoResumeTimeout.current) {
          clearTimeout(autoResumeTimeout.current);
        }
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

      // Cancel auto-resume timer if user became active
      if (autoResumeTimeout.current) {
        clearTimeout(autoResumeTimeout.current);
        autoResumeTimeout.current = null;
      }
    },
  });

  useEffect(() => {
    if (status?.is_error_state) {
      onOpen();
    } else {
      onClose();
    }
  }, [status, onOpen, onClose]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;
      ws = new WebSocket(import.meta.env.VITE_MDB_WS_URL);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.type === "status_snapshot" ||
            payload.type === "status_changed"
          ) {
            setStatus(payload.data);
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      ws.onopen = () => console.log("Connected to MDB watch WS");
      ws.onclose = () => {
        console.log("Disconnected from MDB watch WS");
        if (!disposed) {
          retryTimeout = setTimeout(connect, 3000);
        }
      };
      ws.onerror = (err) => console.error("WS error:", err);
    }

    connect();

    return () => {
      disposed = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;
      ws = new WebSocket(import.meta.env.VITE_INTERPRETER_WS_URL);

      ws.onopen = () => {
        console.log("Connected to interpreter WS (9000)");
        setWsConnected(true);
      };

      ws.onclose = () => {
        console.log("Disconnected from interpreter WS");
        setWsConnected(false);
        if (!disposed) {
          retryTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("WS 9000 error:", err);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "interpreted") {
            const data = payload.data;

            setLines(data.lines || []);
            setProgress(data.progress || 0);
            setTech(data.tech || false);
            setReady(data.ready || false);

            setSugar(data.sugar);

            if (data.progress > 0 && !data.ready) {
              setLoading(true);
            } else if (data.ready) {
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      ws?.close();
    };
  }, []);
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
  const sessionBusy = useRef(false);
  useEffect(() => {
    if (!status || sessionBusy.current) return;
    if (status.is_error_state || status.is_service_state) return;

    const reopen = async (close: boolean) => {
      sessionBusy.current = true;
      try {
        if (close) await callApi("sessionClose");
        await callApi("sessionOpen");
      } finally {
        sessionBusy.current = false;
      }
    };

    if (status.session_is_requested_to_cancel) reopen(true);
    else if (!status.session_is_open) reopen(false);
  }, [status]);
  // async function handleProduct(index: number) {
  //   try {
  //     await callApi("vendRequest", {
  //       price: CoffeeData[index].price,
  //       itemNumber: index,
  //     });

  //     await waitForStatus((s) => s?.session_vend_approved);

  //     await new Promise((resolve) => setTimeout(resolve, 3000));

  //     await callApi("vend-success", { itemNumber: index });
  //     await callApi("sessionClose");

  //     await waitForStatus((s) => !s?.session_is_open, 20000);

  //     await callApi("sessionOpen");
  //   } catch (err) {
  //     console.error("Vend flow failed:", err);

  //     // optional recovery
  //     await callApi("sessionClose");
  //     await callApi("sessionOpen");
  //   }
  // }

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
  const finishedRef = useRef(false);

  useEffect(() => {
    if (ready && lastProductRef.current != null && !finishedRef.current) {
      finishedRef.current = true;
      product_finished(lastProductRef.current);
    }

    if (!ready) {
      finishedRef.current = false;
    }
  }, [ready]);
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

  async function handleProduct(index: number) {
    try {
      await callApi("vendRequest", {
        price: coffeeList[index].price,
        itemNumber: index,
      });

      // Wait until vend is approved (up to 2 min for customer to insert payment)
      await waitForStatus((s) => !!s?.vend_approved, 120000);
      // await click_button(coffeeList[index].servId);

      // 3-second delay
      await new Promise((resolve) => setTimeout(resolve, 5000));
      click_button(coffeeList[index].servId);

      await callApi("vendSuccess", { itemNumber: index });
      await callApi("sessionClose");

      await waitForStatus((s) => !s?.session_is_open, 120000);

      await callApi("sessionOpen");
    } catch (err) {
      console.error("Vend flow failed:", err);
      await callApi("sessionClose");
      await callApi("sessionOpen");
    }
  }
  useEffect(() => {
    return () => {
      if (autoResumeTimeout.current) {
        clearTimeout(autoResumeTimeout.current);
      }
    };
  }, []);
  const clearAutoResumeTimer = () => {
    if (autoResumeTimeout.current) {
      clearTimeout(autoResumeTimeout.current);
      autoResumeTimeout.current = null;
    }
  };

  function waitForStatus(
    predicate: (status: MdbStatus | null) => boolean,
    timeout = 10000,
  ) {
    return new Promise<void>((resolve, reject) => {
      const start = Date.now();

      const interval = setInterval(() => {
        const currentStatus = statusRef.current;

        if (predicate(currentStatus)) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error("Timeout"));
        }
      }, 200);
    });
  }

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

          {/* <Status status={status} /> */}
          <LanguageSwitcher locale={locale} onChange={setLocale} />
          {/*
          <Buttons callApi={callApi} /> */}
          {/* <Box
          p={4}
          textAlign="center"
          width="100vw"
          bg={presence ? "green.400" : "gray.200"}
          color={presence ? "white" : "black"}
          borderRadius="md"
          mb={4}
        >
          Presence: {presence ? "YES" : "NO"}
          <br />
          Distance: {distance !== null ? `${distance} cm` : "—"}
        </Box>
        <Status status={status}></Status> */}

          {loading || ready ? (
            <>
              <LoadingScreen progress={progress} ready={ready} />
              <VisuallyHidden>
                <SugarPanel
                  tech={tech}
                  status={status}
                  onClick={click_button}
                  lines={lines}
                  setTech={setTech}
                  setProgress={setProgress}
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
                onClick={click_button}
                lines={lines}
                setTech={setTech}
                setProgress={setProgress}
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
                  onClick={click_button}
                  getCurrentPrice={getCurrentPrice}
                />
              )}

              <CoffeeGrid
                coffeeList={coffeeList}
                setCoffeeList={setCoffeeList}
                onClick={handleProduct}
                tech={tech}
                disabled={!tech && current !== null}
              />
            </>
          )}

          {/* <CoffeeGrid
            coffeeList={coffeeList}
            setCoffeeList={setCoffeeList}
            onClick={handleProduct}
            tech={tech}
            disabled={!tech && current !== null}
          /> */}
        </Box>
      </IntlProvider>
    </>
  );
}

export default App;
