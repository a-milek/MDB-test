import { Flex, Box, VStack, Text, HStack } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import type { MdbStatus } from "../App";

interface Props {
  status: MdbStatus | null;
  sugar: number;
  tech: boolean;
  lines: string[];
  outOfOrder?: boolean;
  unrecognized?: boolean;
}

// LCD custom glyphs (CGRAM 0x00-0x07: sugar/progress bars) arrive as control
// characters; draw them as solid blocks instead of invisible/garbage chars.
// eslint-disable-next-line no-control-regex
const lcdText = (line: string) => line.replace(/[\x00-\x07]/g, "█");

const Screen = ({
  status,
  sugar,
  tech,
  lines,
  outOfOrder,
  unrecognized,
}: Props) => {
  const intl = useIntl();
  // Mirror the machine's LCD verbatim when we can't (or shouldn't) translate it.
  // Also when payservice sends no status: the LCD beats a bare "NO DATA".
  const showRaw =
    tech || outOfOrder || unrecognized || (!status && lines.length > 0);

  const friendlyLines = status
    ? [
        status.vend_approved
          ? intl.formatMessage({ id: "drink_preparing" })
          : status.session_is_open
            ? (status.item_price ?? 0) > 0
              ? intl.formatMessage({ id: "picked_drink" })
              : intl.formatMessage({ id: "session_open" })
            : intl.formatMessage({ id: "session_closed" }),

        (status.funds_available ?? 0) > 0
          ? intl.formatMessage(
              { id: "credit" },
              { amount: (status.funds_available ?? 0).toFixed(2) },
            )
          : null,

        status.item_price > 0
          ? intl.formatMessage(
              { id: "price" },
              { price: status.item_price.toFixed(2) },
            )
          : null,

        status.is_insufficient_change
          ? intl.formatMessage({ id: "unsuficient_change" })
          : null,

        status.is_cash_only ? intl.formatMessage({ id: "cash_only" }) : null,

        status.is_card_only ? intl.formatMessage({ id: "card_only" }) : null,

        status.is_notes_not_accepted
          ? intl.formatMessage({ id: "notes_not_accepted" })
          : null,
      ].filter(Boolean)
    : ["NO DATA"];

  return (
    <Flex
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      <Box
        width="100%"
        height="100%"
        textAlign="center"
        userSelect="none"
        bg="black"
        borderRadius="md"
        p={0}
      >
        <VStack gap={1} py={3} height="100%">
          <VStack gap={3} flex="1" justify="center" w="100%">
            {showRaw
            ? Array.from({ length: 4 }).map((_, i) => (
                <Text
                  key={i}
                  color="white"
                  fontSize="2xl"
                  fontFamily="mono"
                  whiteSpace="pre"
                >
                  {lcdText(lines[i] || " ")}
                </Text>
              ))
            : friendlyLines.map((line, i) => (
                <Text key={i} color="white" fontSize="2xl">
                  {line}
                </Text>
              ))}
          </VStack>
          {tech || unrecognized ? null : (
            <HStack justify="center" align="bottom" pb={2}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Box
                  key={i}
                  boxSize="30px"
                  bg={i < sugar ? "whiteAlpha.800" : "whiteAlpha.200"}
                  borderRadius="sm"
                />
              ))}
            </HStack>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

export default Screen;
