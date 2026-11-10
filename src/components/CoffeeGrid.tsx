import {
  Box,
  Grid,
  SimpleGrid,
  Image,
  Text,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import PriceEditModal from "./PriceEditModal";
import NameEditModal from "./NameEditModal";
import PhotoEditModal from "./PhotoEditModal";
import IndexEditModal from "./IndexEditModal";
import type { CoffeeType } from "../hooks/useCoffeeList";
import { iconUrl } from "../config/coffeeIcons";

const ButtonStyleCancel = {
  fontSize: "3xl",
  background: "red.500",
  variant: "subtle",
  fontWeight: "semibold",
  color: "white",
  width: "33%",
  height: "100%",
  userSelect: "none" as const,
};
// Customer view: fixed column count, rows sized so the whole list fits on screen
const CUSTOMER_COLUMNS = 4;

const ButtonStyle = {
  fontSize: "3xl",
  background: "black",
  variant: "subtle",
  fontWeight: "semibold",
  color: "white",
  width: "100%",
  height: "100%",
  userSelect: "none" as const,
};

interface Props {
  onClick: (index: number) => void;
  tech: boolean;
  coffeeList: CoffeeType[];
  setCoffeeList: React.Dispatch<React.SetStateAction<CoffeeType[]>>;
  disabled: boolean;
  // Index of the coffee with an in-progress vend; highlighted, others blocked
  activeIndex?: number | null;
  cancelOrder?: () => void;
  cancelling?: boolean;
  cancelCountdown?: number | null;
  // True when money is inserted (lets the user cancel before picking a coffee)
  hasFunds?: boolean;
}

const CoffeeGrid = ({
  onClick,
  tech,
  coffeeList,
  setCoffeeList,
  disabled,
  activeIndex = null,
  cancelOrder,
  cancelling = false,
  cancelCountdown = null,
  hasFunds = false,
}: Props) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(
    null,
  );
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(
    null,
  );

  // Track selected (highlighted) coffee index:
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const photoModal = useDisclosure();
  const priceModal = useDisclosure();
  const nameModal = useDisclosure();
  const indexModal = useDisclosure();

  const updateStorage = (updated: CoffeeType[]) => {
    setCoffeeList(updated);
    // localStorage is handled by parent now
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    const updated = [...coffeeList];
    updated[index].price = newPrice;
    updateStorage(updated);
  };

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...coffeeList];
    updated[index].name = newName;
    updateStorage(updated);
  };

  // useEffect(() => {
  //   if (selectedIndex !== null) {
  //     const timeout = setTimeout(() => {
  //       setSelectedIndex(null);
  //     }, 7000); // 7 seconds

  //     return () => clearTimeout(timeout); // Cleanup if index changes before 10s
  //   }
  // }, [selectedIndex]);

  const handleIndexChange = (index: number, inputValue: string) => {
    const n = parseInt(inputValue, 10);

    if (isNaN(n)) {
      alert("Podaj liczbę");
      return;
    }

    const servIdNumber = n + 1;

    let servId: string;

    if (servIdNumber <= 9) {
      servId = servIdNumber.toString();
    } else {
      servId = String.fromCharCode(55 + servIdNumber);
    }

    const updated = [...coffeeList];
    updated[index].servId = servId;
    updateStorage(updated);
  };

  const handleSetPriceClick = (index: number) => {
    setEditingIndex(index);
    priceModal.onOpen();
  };

  const handleSetNameClick = (index: number) => {
    setEditingNameIndex(index);
    nameModal.onOpen();
  };

  const handleSetPicClick = (index: number) => {
    setEditingPhotoIndex(index);
    photoModal.onOpen();
  };

  const handleCoffeeClick = (index: number) => {
    // While a vend is in progress, only its own coffee is interactive
    if (activeIndex !== null) return;
    if (!tech && disabled) return;

    setSelectedIndex(index); // visual highlight
    onClick(index);
  };

  const handleSetIndexClick = (index: number) => {
    setSelectedButtonIndex(index);
    indexModal.onOpen();
  };

  const servIdToDisplayNumber = (servId: string): number => {
    if (/^[2-9]$/.test(servId)) {
      return parseInt(servId, 10) - 1;
    } else if (/^[A-H]$/.test(servId)) {
      return servId.charCodeAt(0) - 55 - 1;
    }
    return 1;
  };

  // Drop the local click highlight once the vend ends (or is cancelled).
  // Done during render (not in an effect) to avoid a cascading re-render.
  const [prevActiveIndex, setPrevActiveIndex] = useState(activeIndex);
  if (activeIndex !== prevActiveIndex) {
    setPrevActiveIndex(activeIndex);
    if (activeIndex === null) setSelectedIndex(null);
  }

  // The active vend (if any) takes precedence over a plain click highlight
  const highlightIndex = activeIndex ?? selectedIndex;

  // fit=true: tile is the largest square that fits its grid cell (customer view)
  const renderTile = (coffee: CoffeeType, index: number, fit: boolean) => (
    <Box
      position="relative"
      width={fit ? "min(100cqw, 100cqh)" : "100%"}
      height={fit ? "min(100cqw, 100cqh)" : undefined}
      onClickCapture={() => handleCoffeeClick(index)}
      borderRadius="xl"
      overflow="hidden"
      cursor="none"
      opacity={activeIndex !== null && activeIndex !== index ? 0.4 : 1}
      transition="opacity 0.3s ease"
    >
      <Image
        src={iconUrl(coffee.image) || "assets/icons/empty.png"}
        alt={coffee.name}
        width="100%"
        height={fit ? "100%" : undefined}
        objectFit="cover"
        borderRadius="lg"
        draggable={false}
        userSelect="none"
      />
      <Text
        position="absolute"
        bottom={0}
        left={0}
        bg="white"
        opacity={"70%"}
        color="#242424"
        width="100%"
        height="25%"
        fontSize={fit ? "clamp(0.75rem, 9cqmin, 2.25rem)" : "xl"}
        fontWeight="bold"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
        userSelect="none"
        borderBottomRadius="lg"
      >
        {coffee.price.toFixed(2).replace(".", ",")}zł
      </Text>

      <Box
        position="absolute"
        inset={0}
        borderWidth="3px"
        borderColor={highlightIndex === index ? "white" : "black"}
        borderRadius="xl"
        transition="border-color 0.3s ease"
        pointerEvents="none"
        zIndex={1}
      />

      <Text
        position="absolute"
        top={fit ? "4%" : 3}
        left={0}
        width="100%"
        px={1}
        color="white"
        fontSize={fit ? "clamp(0.75rem, 8cqmin, 2rem)" : "xl"}
        lineHeight="short"
        fontWeight="bold"
        pointerEvents="none"
        userSelect="none"
        textAlign="center"
      >
        {coffee.name}
      </Text>

      {tech && (
        <Text
          position="absolute"
          bottom={3}
          right={3}
          bg="whiteAlpha.800"
          color="black"
          fontWeight="bold"
          fontSize="lg"
          px={2}
          py={1}
          borderRadius="md"
          userSelect="none"
          pointerEvents="none"
          minWidth="24px"
          textAlign="center"
        >
          {servIdToDisplayNumber(coffee.servId)}
        </Text>
      )}
    </Box>
  );

  const techButtons = [
    ["Cena", handleSetPriceClick],
    ["Nazwa", handleSetNameClick],
    ["Obrazek", handleSetPicClick],
    ["Indeks", handleSetIndexClick],
  ] as const;

  const customerRows = Math.max(
    1,
    Math.ceil(coffeeList.length / CUSTOMER_COLUMNS),
  );

  return (
    <>
      {tech ? (
        <SimpleGrid columns={5} gap={5} paddingY={5} width="80%" mx="auto">
          {coffeeList.map((coffee, index) => (
            <Box key={index}>
              {renderTile(coffee, index, false)}
              {techButtons.map(([label, handler]) => (
                <Box mt={2} key={label}>
                  <Button
                    size="md"
                    {...ButtonStyle}
                    onClick={() => handler(index)}
                  >
                    {label}
                  </Button>
                </Box>
              ))}
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Grid
          flex="1"
          minH={0}
          width="min(100%, 1600px)"
          mx="auto"
          p="2vmin"
          gap="2vmin"
          templateColumns={`repeat(${CUSTOMER_COLUMNS}, minmax(0, 1fr))`}
          templateRows={`repeat(${customerRows}, minmax(0, 1fr))`}
        >
          {coffeeList.map((coffee, index) => (
            <Box
              key={index}
              minW={0}
              minH={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ containerType: "size" }}
            >
              {renderTile(coffee, index, true)}
            </Box>
          ))}
        </Grid>
      )}
      {cancelOrder && (activeIndex !== null || hasFunds) && (
        <Button
          {...ButtonStyleCancel}
          width="80%"
          height="auto"
          flexShrink={0}
          mb="2vmin"
          mx="auto"
          display="block"
          onClick={cancelOrder}
          isDisabled={cancelling}
        >
          Anuluj{" "}
          {cancelCountdown !== null
            ? ` (${cancelCountdown.toFixed(1).replace(".", ",")}s)`
            : ""}
        </Button>
      )}

      <PriceEditModal
        isOpen={priceModal.isOpen}
        onClose={priceModal.onClose}
        onSave={(price) => {
          if (editingIndex !== null) {
            handlePriceChange(editingIndex, price);
          }
        }}
      />

      <PhotoEditModal
        isOpen={photoModal.isOpen}
        onClose={photoModal.onClose}
        onSave={(newImageSrc) => {
          if (editingPhotoIndex !== null) {
            const updated = [...coffeeList];
            updated[editingPhotoIndex].image = newImageSrc;
            updateStorage(updated);
          }
        }}
      />

      <NameEditModal
        isOpen={nameModal.isOpen}
        onClose={nameModal.onClose}
        onSave={(name) => {
          if (editingNameIndex !== null) {
            handleNameChange(editingNameIndex, name);
          }
        }}
      />

      <IndexEditModal
        isOpen={indexModal.isOpen}
        onClose={indexModal.onClose}
        onSave={(inputValue) => {
          if (selectedButtonIndex !== null) {
            handleIndexChange(selectedButtonIndex, inputValue);
          }
        }}
      />
    </>
  );
};

export default CoffeeGrid;
