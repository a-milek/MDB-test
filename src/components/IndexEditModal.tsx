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
import { useRef } from "react";
import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inputValue: string) => void;
}

const IndexEditModal = ({ isOpen, onClose, onSave }: Props) => {
  const [inputValue, setInputValue] = useState<string>("");
  const initialRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) setInputValue("");
  }, [isOpen]);

  const handleNumpadClick = (value: string) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (value === "C") {
      setInputValue("");
    } else if (value === "←") {
      setInputValue((prev) => prev.slice(0, -1));
    } else {
      setInputValue((prev) => prev + value);
    }
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
          <Button
            key={b}
            onClick={() => handleNumpadClick(b)}
            _focus={{ boxShadow: "none" }}
            _active={{ bg: "blue.100" }}
          >
            {b}
          </Button>
        ))}
      </SimpleGrid>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="xs"
      initialFocusRef={initialRef}
      autoFocus={false}
      trapFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nowy numer</ModalHeader>
        <ModalBody>
          <Input
            ref={initialRef}
            position="absolute"
            opacity={0}
            height="1px"
            pointerEvents="none"
            tabIndex={-1}
          />
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
          <Button
            colorScheme="blue"
            onClick={() => {
              onSave(inputValue);
              onClose();
            }}
          >
            Zapisz
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default IndexEditModal;
