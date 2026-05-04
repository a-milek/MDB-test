import { Flex, Box, VStack, Text, HStack } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import type { MdbStatus } from "../App";

interface Props {
  status: MdbStatus | null;
  sugar: number;
  tech: boolean;
}

const Screen = ({ status, sugar, tech }: Props) => {
  const intl = useIntl();

  const lines = status
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
      height="100%" // fill parent completely
      justifyContent="center"
      alignItems="center"
    >
      <Box
        width="100%"
        height="100%" // fill Flex completely
        textAlign="center"
        userSelect="none"
        bg="black"
        borderRadius="md"
        p={0} // remove padding
      >
        <VStack
          gap={2}
          py={5}
          height="100%" // fill Box height
        >
          {lines.map((line, i) => (
            <Text key={i} color="white" fontSize="2xl" flex="1">
              {line}
            </Text>
          ))}
          {tech ? null : (
            <HStack justify="center" align={"bottom"} pb={2}>
              {sugar != 0
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Box
                      key={i}
                      boxSize="30px" // ← tweak size here if needed
                      bg={i < sugar ? "whiteAlpha.800" : "black"}
                      borderRadius="sm"
                    />
                  ))
                : " "}
            </HStack>
          )}
        </VStack>
      </Box>
    </Flex>
  );
};

export default Screen;
