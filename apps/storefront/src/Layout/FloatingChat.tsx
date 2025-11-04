import {
  Box,
  Flex,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { ChatIcon, CloseIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { FC, useEffect } from "react";
import { AGENT_IFRAME_ORIGIN } from "../constants";
import { Tokens } from "ordercloud-javascript-sdk";
import { useShopper } from "@ordercloud/react-sdk";

const MotionBox = motion(Box);

const FloatingChat: FC = () => {
  const chatDisclosure = useDisclosure();
  const { refreshWorksheet } = useShopper();

  
useEffect(() => {
  const iframe = document.getElementById('shopping-agent-iframe') as HTMLIFrameElement | null;

  if (!iframe) return;

  iframe.addEventListener('load', async () => {
    debugger;
    const token = await Tokens.GetAccessToken();
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({type: 'TOKEN', data: token}, AGENT_IFRAME_ORIGIN);
    }
  });

  window.addEventListener('message', (event) => {
    debugger;
    if (event.origin !== AGENT_IFRAME_ORIGIN) return;

    const { type } = event.data;

    debugger;
    if(type === 'REFRESH_CART') {
      refreshWorksheet();
    }
  });

}, [refreshWorksheet]);


  return (
    <>
      {/* Floating Chat Button */}
      <IconButton
        icon={<ChatIcon boxSize={8} />}
        aria-label="Open Chat"
        position="fixed"
        bottom="24px"
        right="24px"
        bg="primary"
        fill="white"
        border="2px solid white"
        borderRadius="full"
        boxShadow="2xl"
        w="70px"
        h="70px"
        zIndex="1000"
        onClick={chatDisclosure.onToggle}
        _hover={{
          transform: "scale(1.25) rotate(8deg)",
          boxShadow: "3xl",
        }}
        transition="all 0.3s ease-in-out"
      />

      {/* Animated Chat Window */}
      <AnimatePresence>
        {chatDisclosure.isOpen && (
          <MotionBox
            position="fixed"
            bottom="100px"
            right="24px"
            w="400px"
            h="700px"
            bg="white"
            borderRadius="lg"
            boxShadow="2xl"
            overflow="hidden"
            zIndex="1000"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <Flex
              bg="gray.100"
              p={3}
              align="center"
              justify="space-between"
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <Text fontWeight="bold">Chat with us!</Text>
              <IconButton
                icon={<CloseIcon />}
                aria-label="Minimize Chat"
                size="sm"
                variant="ghost"
                onClick={chatDisclosure.onClose}
              />
            </Flex>

            {/* Placeholder for chat content */}
            <Box p={4} height="643px">
              <iframe
              id="shopping-agent-iframe"
              width="100%"
              height="100%"
    src={AGENT_IFRAME_ORIGIN + "/noauth"}
    className="shopping-agent-container"
    title="Personalized Shopping Agent"
>
</iframe>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChat;