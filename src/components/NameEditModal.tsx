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
  Box,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
}

const NameEditModal = ({ isOpen, onClose, onSave }: Props) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    if (isOpen) setInputValue("");
  }, [isOpen]);

  const polishUpperMap: Record<string, string> = {
    ą: "Ą",
    ć: "Ć",
    ę: "Ę",
    ł: "Ł",
    ń: "Ń",
    ó: "Ó",
    ś: "Ś",
    ź: "Ź",
    ż: "Ż",
  };

  const handleKeyboardClick = (value: string) => {
    if (value === "C") {
      setInputValue("");
    } else if (value === "←") {
      setInputValue((prev) => prev.slice(0, -1));
    } else if (value === "Caps") {
      setCapsLock(!capsLock);
    } else {
      if (capsLock) {
        const upperChar = polishUpperMap[value] || value.toUpperCase();
        setInputValue((prev) => prev + upperChar);
      } else {
        setInputValue((prev) => prev + value);
      }
    }
  };

  const handleSave = () => {
    if (inputValue.trim()) {
      const trimmed = inputValue.trim();
      const formattedName =
        trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      onSave(formattedName);
    }
    onClose();
  };

  // Podział klawiszy na rzędy
  const row1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const row2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "Caps"];
  const row3 = ["z", "x", "c", "v", "b", "n", "m", "←", " ", "C"];
  const polishKeys = ["ą", "ć", "ę", "ł", "ń", "ó", "ś", "ź", "ż"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nowa nazwa</ModalHeader>
        <ModalBody>
          <Input
            mb={4}
            value={inputValue}
            readOnly
            textAlign="left"
            fontSize="xl"
          />

          <SimpleGrid columns={10} gap={3} mb={2}>
            {row1.map((k, i) => (
              <Button key={i} onClick={() => handleKeyboardClick(k)}>
                {k}
              </Button>
            ))}
          </SimpleGrid>

          <SimpleGrid columns={10} gap={3} mb={2}>
            {row2.map((k, i) => (
              <Button key={i} onClick={() => handleKeyboardClick(k)}>
                {k === "Caps" ? (capsLock ? "Caps ON" : "Caps") : k}
              </Button>
            ))}
          </SimpleGrid>

          <SimpleGrid columns={10} gap={3} mb={2}>
            {row3.map((k, i) => (
              <Button key={i} onClick={() => handleKeyboardClick(k)}>
                {k === " " ? "Spacja" : k}
              </Button>
            ))}
          </SimpleGrid>

          <Box mb={2} fontWeight="bold" color="gray.600" textAlign="center">
            Polskie znaki
          </Box>

          <SimpleGrid columns={9} gap={3}>
            {polishKeys.map((k, i) => (
              <Button key={i} onClick={() => handleKeyboardClick(k)}>
                {k}
              </Button>
            ))}
          </SimpleGrid>
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

export default NameEditModal;
