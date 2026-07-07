import { Box, HStack, IconButton } from "@chakra-ui/react";
import React from "react";
import * as Flags from "country-flag-icons/react/3x2";

type Locale = "pl" | "en";

type LanguageSwitcherProps = {
  locale: Locale;
  onChange: (newLocale: Locale) => void;
};

const LOCALE_TO_COUNTRY: Record<Locale, keyof typeof Flags> = {
  pl: "PL",
  en: "GB",
};

const FLAG_SIZE = 32;

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  locale,
  onChange,
}) => {
  return (
    <HStack position="fixed" top={8} right={4} zIndex={10}>
      {(Object.keys(LOCALE_TO_COUNTRY) as Locale[]).map((loc) => {
        const country = LOCALE_TO_COUNTRY[loc];
        const Flag = Flags[country];
        const isActive = locale === loc;
        return (
          <IconButton
            key={loc}
            aria-label={loc}
            onClick={() => onChange(loc)}
            variant="ghost"
            isRound
            borderWidth={2}
            borderColor={isActive ? "white" : "transparent"}
            icon={
              <Box
                width={`${FLAG_SIZE}px`}
                height={`${FLAG_SIZE}px`}
                borderRadius="full"
                overflow="hidden"
                position="relative"
              >
                <Flag
                  title={country}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: "100%",
                    width: "auto",
                  }}
                />
              </Box>
            }
          />
        );
      })}
    </HStack>
  );
};

export default LanguageSwitcher;
