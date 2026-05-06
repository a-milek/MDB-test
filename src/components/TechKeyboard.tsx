import { Button, VStack, GridItem, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";
import key_config from "../config/KeyConfig";

interface NumPadProps {
  onClick: (index: number) => void;
  getCurrentPrice: () => number | null;
}

const TechKeyboard = ({ onClick, getCurrentPrice }: NumPadProps) => {
  const [status, setStatus] = useState<string>("");
  const LOCAL_STORAGE_KEY = "coffee-prices";
  const ButtonStyle = {
    fontSize: "3xl",
    background: "black",
    variant: "subtle",
    fontWeight: "semibold",
    color: "white",
    width: "100%",
    height: "100%",
    userSelect: "none" as const,
  };

  const errReset = async () => {
    onClick(key_config.esc);
    await sleep(1000);
    onClick(key_config.enter);
    await sleep(1000);
    onClick(key_config.plus);
    await sleep(1000);
    onClick(key_config.enter);
  };

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const priceLoad = async () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      setStatus("Brak cen w localStorage");
      return;
    }

    let coffeePrices;
    try {
      coffeePrices = JSON.parse(stored) as { price: number }[];
    } catch {
      setStatus("Błąd odczytu cen z localStorage");
      return;
    }

    for (let i = 0; i < coffeePrices.length; i++) {
      setStatus(`Wybieram kawę nr ${i}`);
      await onClick(i + 2);
      await sleep(300); // odczekaj po wybraniu kawy

      const targetPrice = coffeePrices[i].price;
      let currentPrice = getCurrentPrice();

      if (currentPrice === null || isNaN(currentPrice)) {
        setStatus("Brak aktualnej ceny");
        return;
      }

      setStatus(
        `Ustawiam cenę dla pozycji ${i}: ${currentPrice.toFixed(
          2,
        )} → ${targetPrice.toFixed(2)}`,
      );

      while (Math.abs(currentPrice - targetPrice) > 0.0) {
        if (currentPrice < targetPrice) {
          await onClick(key_config.plus); // PLUS
        } else {
          await onClick(key_config.minus); // MINUS
        }

        await sleep(150);

        currentPrice = getCurrentPrice();

        if (currentPrice === null || isNaN(currentPrice)) {
          setStatus("Przerwano: cena się utraciła");
          return;
        }

        setStatus(
          `Ustawiam cenę: ${currentPrice.toFixed(
            2,
          )} → cel: ${targetPrice.toFixed(2)}`,
        );
      }

      setStatus(
        `Cena ustawiona dla pozycji ${i}: ${currentPrice.toFixed(
          2,
        )}. Klikam Enter.`,
      );
      await onClick(key_config.enter); // ENTER

      await sleep(500); // opcjonalne odczekanie przed kolejną pozycją
    }

    setStatus("Wszystkie ceny ustawione.");
  };

  return (
    <>
      {status}
      <VStack gap={2}>
        <SimpleGrid columns={2} gap={3} height="100%" width="80%" mx="auto">
          <GridItem>
            <Button onClick={() => onClick(key_config.enter)} {...ButtonStyle}>
              Enter
            </Button>
          </GridItem>
          <GridItem>
            <Button onClick={() => onClick(key_config.esc)} {...ButtonStyle}>
              Escape
            </Button>
          </GridItem>
          <GridItem>
            <Button onClick={errReset} {...ButtonStyle}>
              Reset Błędów
            </Button>
          </GridItem>
          <GridItem>
            <Button onClick={priceLoad} {...ButtonStyle}>
              Wgraj ceny
            </Button>
          </GridItem>
        </SimpleGrid>
        {/* <Text
          color="white"
          fontSize="md"
          whiteSpace="pre-line"
          minHeight="3em"
          pt={2}
        >
          {status}
        </Text> */}
      </VStack>
    </>
  );
};

export default TechKeyboard;
