import { HStack, Button } from "@chakra-ui/react";

import { useIntl } from "react-intl";

interface ButtonsProps {
  callApi: (
    endpoint: string,
    body?: Record<string, string | number | boolean>,
  ) => Promise<unknown>;
}

const Buttons = ({ callApi }: ButtonsProps) => {
  const intl = useIntl();
  return (
    <HStack alignContent={"center"}>
      <Button colorScheme={"blue"} onClick={() => callApi("sessionOpen")}>
        {intl.formatMessage({ id: "button.open_session" })}
      </Button>
      <Button colorScheme={"blue"} onClick={() => callApi("sessionClose")}>
        {intl.formatMessage({ id: "button.close_session" })}
      </Button>
      <Button
        colorScheme={"blue"}
        onClick={() => callApi("vendRequest", { price: 2.5, itemNumber: 2 })}
      >
        {intl.formatMessage({ id: "button.vend_item" })}
      </Button>
      <Button
        colorScheme={"blue"}
        onClick={() => callApi("vendSuccess", { itemNumber: 2 })}
      >
        {intl.formatMessage({ id: "button.vend_success" })}
      </Button>
      <Button colorScheme={"blue"} onClick={() => callApi("getStatus")}>
        {intl.formatMessage({ id: "button.get_status" })}
      </Button>
    </HStack>
  );
};

export default Buttons;
