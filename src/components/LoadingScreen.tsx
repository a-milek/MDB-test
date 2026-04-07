import { useEffect, useState } from "react";
import { Flex, Image, Box, Heading } from "@chakra-ui/react";

interface Props {
  progress: number;
  ready: boolean;
}

export default function LoadingScreen({ ready }: Props) {
  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    if (ready) {
      const timeout = setTimeout(() => setShowReady(true), 500);
      return () => clearTimeout(timeout);
    } else {
      setShowReady(false);
    }
  }, [ready]);

  return (
    <Flex
      minW="100vw"
      minH="100vh"
      justify="center"
      align="center"
      position="relative"
      direction="column"
    >
      <Image
        src="assets/coffee-2.gif"
        alt="Brewing coffee..."
        objectFit="cover"
        width="100%"
        height="100%"
        position="absolute"
        top="0"
        left="0"
        zIndex={0}
      />

      <Box
        position="relative"
        zIndex={1}
        width="70%"
        textAlign="center"
        height="20%"
      >
        {
          showReady ? (
            <Box height="5vh">
              <Heading
                color="white"
                fontSize={"50px"}
                fontWeight="bold"
                background="blackAlpha.800"
              >
                ODBIERZ PRODUKT
              </Heading>
            </Box>
          ) : null
          // <Progress
          //   value={progress}
          //   size="lg"
          //   height="5vh"
          //   variant="outline"
          //   sx={{
          //     borderColor: "white",
          //     background: "black",
          //     "& > div": {
          //       backgroundColor: "white",
          //     },
          //   }}
          // />
        }
      </Box>
    </Flex>
  );
}
