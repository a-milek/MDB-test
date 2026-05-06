import { useEffect, useState } from "react";
import { Flex, Image } from "@chakra-ui/react";
const TimeoutScreen = () => {
  const [selectedAd, setSelectedAd] = useState<string>("");

  const ads = import.meta.glob("/src/assets/ads/*.{png,jpg,jpeg,svg,gif}", {
    eager: true,
    import: "default",
  });
  const adsSrcs = Object.entries(ads).map(([path, mod]: any) => {
    return mod.default || path.replace("/src/assets/", "assets/");
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * adsSrcs.length);
    setSelectedAd(adsSrcs[randomIndex]);
  }, []);

  return (
    <>
      {selectedAd && (
        <Flex
          minW="100vw"
          minH="100vh"
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
          />
        </Flex>
      )}
    </>
  );
};

export default TimeoutScreen;
