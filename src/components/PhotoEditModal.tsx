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
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newImageSrc: string) => void;
}

// Dynamiczne importowanie ikon z folderu /src/assets/icons (Vite)
const icons = import.meta.glob("/src/assets/icons/*.{png,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
});
const iconSrcs = Object.entries(icons).map(([path, mod]: any) => {
  return mod.default || path.replace("/src/assets/", "assets/");
});

const PhotoEditModal = ({ isOpen, onClose, onSave }: Props) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isOpen) setInputValue("");
  }, [isOpen]);

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
            {iconSrcs.map((src, i) => (
              <Box
                key={i}
                borderColor={src === inputValue ? "blue.400" : "gray.300"}
                borderRadius="md"
                cursor="none"
                onClick={() => handleIconClick(src)}
                _hover={{ borderColor: "blue.600" }}
                p={1}
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Image
                  draggable="false"
                  src={src}
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
