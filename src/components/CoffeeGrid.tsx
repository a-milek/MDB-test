import {
  Box,
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

interface CoffeeType {
  servId: string;
  price: number;
  name: string;
  image: string;
}

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

  return (
    <>
      <SimpleGrid
        columns={3}
        gap={5}
        paddingY={5}
        height="100%"
        width={tech ? "80%" : "80%"}
        mx="auto"
      >
        {coffeeList.map((coffee, index) => (
          <Box key={index}>
            <Box
              position="relative"
              width="100%"
              onClickCapture={() => handleCoffeeClick(index)}
              borderRadius="xl"
              overflow="hidden"
              cursor="none"
              opacity={activeIndex !== null && activeIndex !== index ? 0.4 : 1}
              transition="opacity 0.3s ease"
            >
              <Image
                src={coffee.image || "assets/icons/empty.png"}
                alt={coffee.name}
                width="100%"
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
                fontSize="xl"
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
                top={3}
                left={0}
                width="100%"
                color="white"
                fontSize="xl"
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
            {tech && (
              <>
                <Box mt={2}>
                  <Button
                    size="md"
                    {...ButtonStyle}
                    onClick={() => handleSetPriceClick(index)}
                  >
                    Cena
                  </Button>
                </Box>
                <Box mt={2}>
                  <Button
                    size="md"
                    {...ButtonStyle}
                    onClick={() => handleSetNameClick(index)}
                  >
                    Nazwa
                  </Button>
                </Box>
                <Box mt={2}>
                  <Button
                    size="md"
                    onClick={() => handleSetPicClick(index)}
                    {...ButtonStyle}
                  >
                    Obrazek
                  </Button>
                </Box>
                <Box mt={2}>
                  <Button
                    size="md"
                    onClick={() => handleSetIndexClick(index)}
                    {...ButtonStyle}
                  >
                    Indeks
                  </Button>
                </Box>
              </>
            )}
          </Box>
        ))}
      </SimpleGrid>
      {cancelOrder && (activeIndex !== null || hasFunds) && (
        <Button
          {...ButtonStyleCancel}
          width="80%"
          height="auto"
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
