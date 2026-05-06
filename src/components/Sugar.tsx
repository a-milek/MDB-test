import { AspectRatio, Box, Flex, HStack, Image } from "@chakra-ui/react";
// import ScreenInterpreter from "./ScreenInterpreter";
import type { CSSProperties } from "react";
import key_config from "../config/KeyConfig";
import Screen from "./Screen";
import type { MdbStatus } from "../App";

const noDragStyle = {
  touchAction: "none",
  userSelect: "none",
  WebkitUserDrag: "none",
  WebkitTouchCallout: "none",
} as CSSProperties;

interface Props {
  onClick: (index: number) => void;
  lines?: string[];
  setTech?: (value: boolean) => void;
  setProgress?: (value: number) => void;
  setReady?: (value: boolean) => void;
  setCurrentPrice?: (price: number | null) => void;
  setIsTimedOut?: (value: boolean) => void;
  setLoading?: (value: boolean) => void;
  tech: boolean;
  setHasCredit?: (value: boolean) => void;
  clearAutoResumeTimer?: () => void;
  status: MdbStatus | null;
  sugar: number;
}

const SugarPanel = ({
  onClick,
  tech,
  status,
  sugar,
}: Props) => {
  return (
    <>
      <HStack gap={5} py={2} width="80%" mx="auto" paddingTop="40px">
        <Box
          width="33%"
          style={noDragStyle}
        >
          <Image
            src="assets/less_sugar.png"
            width="100%"
            borderWidth="1px"
            borderRadius="lg"
            onClick={() => onClick(key_config.minus)}
            draggable="false"
            userSelect="none"
          />
        </Box>

        <Flex
          justify="center"
          align="center"
          width={"33%"}
          height="100%"
          style={noDragStyle}
        >
          <Box width="100%" height="100%">
            {" "}
            <AspectRatio ratio={1} width="100%">
              {/* Make Screen fill Flex completely */}
              <Screen status={status} sugar={sugar} tech={tech} />
            </AspectRatio>
          </Box>
          {/* <ScreenInterpreter
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
          /> */}
        </Flex>

        <Box
          width="33%"
          style={noDragStyle}
        >
          <Image
            src="assets/more_sugar.png"
            width="100%"
            borderWidth="1px"
            borderRadius="lg"
            onClick={() => onClick(key_config.plus)}
            draggable="false"
            userSelect="none"
          />
        </Box>
      </HStack>
      {/* <VStack gap={2} paddingY={2} height="7vh">
        <SimpleGrid columns={1} gap={3} height="100%" width="80%" mx="auto">
          <GridItem>
            <Button
              onClick={() => onClick(key_config.cukier)}
              {...ButtonStyle}
              flexDirection="column"
            >
              <Text fontSize="2xl" color="whiteAlpha.800" paddingBottom={2}>
                wciśnij przed wyborem
              </Text>
              <Text fontSize="3xl" color="white" fontWeight="bold">
                DODATKOWY CUKIER
              </Text>
            </Button>
          </GridItem>
        </SimpleGrid>
      </VStack> */}
    </>
  );
};

export default SugarPanel;
