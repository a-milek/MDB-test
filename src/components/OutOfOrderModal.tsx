import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
} from "@chakra-ui/react";
import { useIntl } from "react-intl";

interface OutOfOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OutOfOrderModal = ({ isOpen, onClose }: OutOfOrderModalProps) => {
  const intl = useIntl();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {" "}
          {intl.formatMessage({ id: "out_of_order.title" })}{" "}
        </ModalHeader>

        <ModalBody>
          <Text>{intl.formatMessage({ id: "out_of_order.message" })}</Text>
        </ModalBody>

        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OutOfOrderModal;
