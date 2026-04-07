import { HStack, Button } from "@chakra-ui/react";

import { useIntl } from "react-intl";

interface ButtonsProps {
  callApi: (endpoint: string, body?: any) => Promise<any>;
}

const Buttons = ({ callApi }: ButtonsProps) => {
  const intl = useIntl();
  return (
    <HStack alignContent={"center"}>
      <Button colorScheme={"blue"} onClick={() => callApi("open-session")}>
        {intl.formatMessage({ id: "button.open_session" })}
      </Button>
      <Button colorScheme={"blue"} onClick={() => callApi("close-session")}>
        {intl.formatMessage({ id: "button.close_session" })}
      </Button>
      <Button
        colorScheme={"blue"}
        onClick={() => callApi("vend-request", { price: 2.5, itemNumber: 2 })}
      >
        {intl.formatMessage({ id: "button.vend_item" })}
      </Button>
      <Button
        colorScheme={"blue"}
        onClick={() => callApi("vend-success", { itemNumber: 2 })}
      >
        {intl.formatMessage({ id: "button.vend_success" })}
      </Button>
      <Button colorScheme={"blue"} onClick={() => callApi("status")}>
        {intl.formatMessage({ id: "button.get_status" })}
      </Button>
    </HStack>
  );
};

export default Buttons;
