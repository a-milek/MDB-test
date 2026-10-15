import { useEffect, useRef, useState } from "react";
import coffeeData from "../config/CoffeeData";
import { iconName } from "../config/coffeeIcons";

export interface CoffeeType {
  id?: number;
  servId: string;
  price: number;
  name: string;
  image?: string;
}

// Served by WebControls (Bottle) from a JSON file on the Pi, outside the repo
const COFFEE_DATA_URL = `${import.meta.env.BASE_URL}coffee-data`;
const LOCAL_STORAGE_KEY = "coffee-prices";
const RETRY_MS = 10_000;

const normalize = (list: CoffeeType[]): CoffeeType[] =>
  list.map((c) => ({ ...c, image: iconName(c.image) }));

function loadLocal(): CoffeeType[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return normalize(stored ? JSON.parse(stored) : coffeeData);
  } catch {
    return normalize(coffeeData);
  }
}

async function saveToServer(list: CoffeeType[]) {
  const res = await fetch(COFFEE_DATA_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(list),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// The coffee list lives on the Pi (coffee-data.json); localStorage is only an
// offline copy. Until the server has answered, nothing is written back to it,
// so a kiosk that starts while WebControls is down can't overwrite the file.
export function useCoffeeList() {
  const [coffeeList, setCoffeeList] = useState<CoffeeType[]>(loadLocal);
  const [synced, setSynced] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // JSON of the list as last loaded from / saved to the server
  const serverJson = useRef<string | null>(null);

  // Initial load, retried until WebControls answers
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const load = async () => {
      try {
        const res = await fetch(COFFEE_DATA_URL, { cache: "no-store" });
        if (res.status === 404) {
          // No file on the Pi yet: upload this kiosk's list (its localStorage
          // edits, or CoffeeData.ts) so it becomes the saved one
          const local = loadLocal();
          await saveToServer(local);
          if (cancelled) return;
          serverJson.current = JSON.stringify(local);
          setCoffeeList(local);
        } else if (res.ok) {
          const list = normalize(await res.json());
          if (cancelled) return;
          serverJson.current = JSON.stringify(list);
          setCoffeeList(list);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
        setSynced(true);
      } catch (e) {
        console.warn("Coffee data not loaded from server, retrying:", e);
        if (!cancelled) timer = setTimeout(load, RETRY_MS);
      }
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // Keep the offline copy, and save edits to the server once it's in sync
  useEffect(() => {
    const json = JSON.stringify(coffeeList);
    localStorage.setItem(LOCAL_STORAGE_KEY, json);
    if (!synced || json === serverJson.current) return;

    saveToServer(coffeeList)
      .then(() => {
        serverJson.current = json;
        setSaveError(null);
      })
      .catch((e) => {
        console.error("Saving coffee data failed:", e);
        setSaveError(`Nie zapisano listy na serwerze (${e.message})`);
      });
  }, [coffeeList, synced]);

  return { coffeeList, setCoffeeList, saveError };
}
