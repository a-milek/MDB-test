import { useState, useRef, useEffect } from "react";
import LCD_Simulator from "./LCD_Simulator";

interface Props {
  lines: string[];
  setTech: (value: boolean) => void;
  setProgress: (value: number) => void;
  setReady: (value: boolean) => void;
  setCurrentPrice: (price: number | null) => void;
  setIsTimedOut: (value: boolean) => void;
  setLoading: (value: boolean) => void; // dodaj to
  setHasCredit: (value: boolean) => void;
  tech: boolean;
  clearAutoResumeTimer: () => void;
}

const ScreenInterpreter = ({
  lines,
  setTech,
  setProgress,
  setReady,
  setCurrentPrice,
  tech,
  setLoading,
  setIsTimedOut,
  setHasCredit,
  clearAutoResumeTimer,
}: Props) => {
  const [sugar, setSugar] = useState(0);
  const [interpretedLines, setInterpretedLines] = useState<string[]>([]);
  const lastValidPriceLine = useRef<string | null>(null);

  useEffect(() => {
    interpretLines(lines);
  }, [lines]);

  function interpretLines(rawLines: string[]) {
    const newLines = [...rawLines];
    let foundProgress = false;
    let sugarCount: number | null = null;
    let currentPrice: number | null = null;

    for (let i = 0; i < newLines.length; i++) {
      let line = newLines[i];

      // Cukier
      if (line.startsWith("Cukier")) {
        sugarCount = [...line].filter((ch) => ch === "\x01").length;
        newLines[i] = "\u00A0";
        continue;
      }

      // Postęp
      const codes = [...line].map((ch) => ch.charCodeAt(0));
      const progressCodes = codes.filter(
        (code) => code >= 0x03 && code <= 0x07,
      );
      if (progressCodes.length > 0) {
        setLoading(true);
        foundProgress = true;
        const sum = progressCodes.reduce((a, b) => a + b, 0);
        const percent = Math.round((sum / 126) * 100);
        // console.log(percent);
        if (percent == 100) {
          setReady(true);
        }

        setProgress(percent);
      }

      // Tryb techniczny i gotowość
      if (line.startsWith("TECH") || line.startsWith("NAPE")) {
        setTech(true);
      }
      if (line.startsWith("WYBIERZ")) {
        setLoading(false);
        setTech(false);
        setProgress(0);
        setReady(false);
      }
      if (line.startsWith("NAPOJ")) {
        setProgress(100);
        setReady(true);
      }
      // if (line.startsWith("Kredyt")) {
      //   console.log("kredyt");
      //   setIsTimedOut(false);
      //   setHasCredit(true);
      //   clearAutoResumeTimer();
      // } else {
      //   setHasCredit(false);
      // }
      // // Cena
      // if (line.startsWith("Cena")) {
      //   const hasDigits = /\d/.test(line);
      //   if (hasDigits) {
      //     lastValidPriceLine.current = line;

      //     const match = line.match(/(\d+\.\d{2})/);
      //     currentPrice = match ? parseFloat(match[1]) : null;
      //   } else if (lastValidPriceLine.current) {
      //     newLines[i] = lastValidPriceLine.current;
      //     // Dla kompletności zaktualizuj currentPrice na podstawie ostatniej poprawnej linii
      //     const match = lastValidPriceLine.current.match(/(\d+\.\d{2})/);
      //     currentPrice = match ? parseFloat(match[1]) : null;
      //   }
      // }
    }

    if (!foundProgress) setProgress(0);
    if (sugarCount !== null) {
      setSugar(sugarCount);
    }
    setCurrentPrice(currentPrice);
    setInterpretedLines(newLines);
  }

  return <LCD_Simulator lines={interpretedLines} sugar={sugar} tech={tech} />;
};

export default ScreenInterpreter;
