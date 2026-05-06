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
import { useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inputValue: string) => void;
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
      <Button
        key={b}
        onClick={() => onPress(b)}
        _focus={{ boxShadow: "none" }}
        _active={{ bg: "blue.100" }}
      >
        {b}
      </Button>
    ))}
  </SimpleGrid>
);

const IndexEditModal = ({ isOpen, onClose, onSave }: Props) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const initialRef = useRef<HTMLInputElement | null>(null);

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setInputValue("");
  }

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
          <Numpad onPress={handleNumpadClick} />
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
