import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  SimpleGrid,
} from "@chakra-ui/react";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPrice: number) => void;
}

const NUMPAD_BUTTONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ",",
  "0",
  "←",
];

const Numpad = ({ onPress }: { onPress: (value: string) => void }) => (
  <SimpleGrid columns={3} spacing={2}>
    {NUMPAD_BUTTONS.map((b) => (
      <Button key={b} onClick={() => onPress(b)}>
        {b}
      </Button>
    ))}
  </SimpleGrid>
);

const PriceEditModal = ({ isOpen, onClose, onSave }: Props) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setInputValue("");
  }

  const handleNumpadClick = (value: string) => {
    if (value === "C") {
      setInputValue("");
    } else if (value === "←") {
      setInputValue((prev) => prev.slice(0, -1));
    } else {
      setInputValue((prev) => prev + value);
    }
  };

  const handleSave = () => {
    const parsed = parseFloat(inputValue.replace(",", "."));
    if (!isNaN(parsed)) {
      onSave(parsed);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nowa cena</ModalHeader>
        <ModalBody>
          <Input
            mb={4}
            value={inputValue}
            readOnly
            textAlign="right"
            fontSize="2xl"
          />
          <Numpad onPress={handleNumpadClick} />
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3}>
            Anuluj
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Zapisz
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PriceEditModal;
