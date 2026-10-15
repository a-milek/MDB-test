import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  SimpleGrid,
  Box,
  Image,
} from "@chakra-ui/react";
import { useState } from "react";
import { iconsByName } from "../config/coffeeIcons";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Icon file name, e.g. "3.png" (see config/coffeeIcons)
  onSave: (newImage: string) => void;
}

const iconNames = Object.keys(iconsByName);

const PhotoEditModal = ({ isOpen, onClose, onSave }: Props) => {
  const [inputValue, setInputValue] = useState("");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setInputValue("");
  }

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
    }
    onClose();
  };

  const handleIconClick = (src: string) => {
    setInputValue(src);
  };

  // console.log("iconSrcs", iconSrcs);
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ustaw nowy obrazek</ModalHeader>
        <ModalBody>
          <SimpleGrid columns={3} spacing={3} overflowY="auto">
            {iconNames.map((name, i) => (
              <Box
                key={name}
                borderColor={name === inputValue ? "blue.400" : "gray.300"}
                borderRadius="md"
                cursor="none"
                onClick={() => handleIconClick(name)}
                _hover={{ borderColor: "blue.600" }}
                p={1}
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Image
                  draggable="false"
                  src={iconsByName[name]}
                  alt={`icon-${i}`}
                  boxSize="100%"
                  objectFit="contain"
                  userSelect="none"
                />
              </Box>
            ))}
          </SimpleGrid>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3}>
            Anuluj
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isDisabled={!inputValue.trim()}
          >
            Zapisz
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PhotoEditModal;
