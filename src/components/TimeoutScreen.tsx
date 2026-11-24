import { useState } from "react";
import { Flex, Image } from "@chakra-ui/react";

const ads = import.meta.glob<string>(
  "/src/assets/ads/*.{png,jpg,jpeg,svg,gif}",
  { eager: true, import: "default" },
);
const adsSrcs = Object.values(ads);

const TimeoutScreen = () => {
  const [selectedAd] = useState(
    () => adsSrcs[Math.floor(Math.random() * adsSrcs.length)],
  );

  return (
    <>
      {selectedAd && (
        // Pinned to the viewport so the ad always fits the screen (no scrollbars),
        // letterboxed on black when its aspect ratio differs from the screen's
        <Flex
          position="fixed"
          inset={0}
          overflow="hidden"
          justify="center"
          align="center"
          bg="black"
        >
          <Image
            draggable="false"
            src={selectedAd}
            alt="Advertisement"
            objectFit="contain"
            width="100%"
            height="100%"
            maxW="100%"
            maxH="100%"
          />
        </Flex>
      )}
    </>
  );
};

export default TimeoutScreen;
