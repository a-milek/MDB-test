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
import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPrice: number) => void;
}

const PriceEditModal = ({ isOpen, onClose, onSave }: Props) => {
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (isOpen) setInputValue("");
  }, [isOpen]);

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

  const Numpad = () => {
    const buttons = [
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
    return (
      <SimpleGrid columns={3} spacing={2}>
        {buttons.map((b) => (
          <Button key={b} onClick={() => handleNumpadClick(b)}>
            {b}
          </Button>
        ))}
      </SimpleGrid>
    );
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
          <Numpad />
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
