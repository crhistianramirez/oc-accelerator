import {
  Box,
  Flex,
  IconButton,
  Text,
  useDisclosure,
  Skeleton,
  VStack,
} from "@chakra-ui/react";
import { ChatIcon, CloseIcon, MinusIcon, AddIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { FC, useState } from "react";
import { Rnd } from "react-rnd";
import { AGENT_IFRAME_ORIGIN } from "../constants";

const MotionBox = motion(Box);

const FloatingChat: FC = () => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const [isMinimized, setIsMinimized] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Track dynamic size
  const [size, setSize] = useState({ width: 400, height: 700 });

  // Dynamic initial position with margin
  const margin = 20;
  const initialX =
    Math.max(window.innerWidth - size.width - margin, margin) - 100;
  const initialY = Math.max(window.innerHeight - size.height - margin, margin);

  const handleOpen = () => {
    setIframeLoaded(false); // Reset loader state
    onToggle();
  };

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
        zIndex="2000"
        onClick={handleOpen}
        _hover={{
          transform: "scale(1.25) rotate(8deg)",
          boxShadow: "3xl",
        }}
        transition="all 0.3s ease-in-out"
      />

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <Rnd
            default={{
              x: initialX,
              y: initialY,
              width: size.width,
              height: size.height,
            }}
            size={{
              width: isMinimized ? 300 : size.width,
              height: isMinimized ? 50 : size.height,
            }}
            minWidth={300}
            minHeight={50}
            bounds="window"
            enableResizing={!isMinimized}
            disableDragging={false}
            onResizeStop={(_, __, ref) => {
              setSize({
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
              });
            }}
            style={{ zIndex: 1500, position: "fixed" }}
          >
            <MotionBox
              bg="white"
              borderRadius="lg"
              boxShadow="2xl"
              overflow="hidden"
              h="100%"
              w="100%"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              position="relative"
            >
              {/* Header */}
              <Flex
                bg="gray.100"
                p={3}
                align="center"
                justify="space-between"
                borderBottom="1px solid"
                borderColor="gray.200"
                cursor="move"
              >
                <Text fontWeight="bold">Shopping Agent</Text>
                <Flex gap={2}>
                  <IconButton
                    icon={isMinimized ? <AddIcon /> : <MinusIcon />}
                    aria-label={isMinimized ? "Restore Chat" : "Minimize Chat"}
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMinimized(!isMinimized)}
                  />
                  <IconButton
                    icon={<CloseIcon />}
                    aria-label="Close Chat"
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                  />
                </Flex>
              </Flex>

              {/* Chat Content */}
              <Box
                p={4}
                height="calc(100% - 50px)"
                style={{
                  visibility: isMinimized ? "hidden" : "visible",
                }}
              >
                {!iframeLoaded && (
                  <VStack width="100%">
                    <VStack width="100%" padding="16px">
                      <VStack height="8rem" marginTop="3rem" width="100%">
                        <Skeleton
                          height="50px"
                          width="205px"
                          borderRadius="md"
                        />
                      </VStack>

                      <Box
                        width="100%"
                        display="grid"
                        gridTemplateColumns="1fr"
                        gridAutoRows="auto"
                        alignItems="start"
                        gap="0.7rem"
                      >
                        {[...Array(4)].map((_, i) => (
                          <Skeleton
                            key={i}
                            height="64px"
                            width="100%"
                            borderRadius="md"
                          />
                        ))}
                      </Box>
                    </VStack>
                    <Skeleton marginTop="16px" height="62px" width="302px" />
                  </VStack>
                )}

                <iframe
                  id="shopping-agent-iframe"
                  width="100%"
                  height="100%"
                  src={AGENT_IFRAME_ORIGIN + "/noauth"}
                  title="Personalized Shopping Agent"
                  style={{
                    border: "none",
                    display: iframeLoaded ? "block" : "none",
                  }}
                  onLoad={() => setIframeLoaded(true)}
                />
              </Box>

              {!isMinimized && (
                <Box
                  position="absolute"
                  bottom="0"
                  right="0"
                  width="28px"
                  height="28px"
                  pointerEvents="none"
                  _before={{
                    content: '""',
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    width: "28px",
                    height: "28px",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #ccc 0, #ccc 2px, transparent 2px, transparent 4px)",
                    backgroundSize: "4px 4px",
                    clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
                  }}
                />
              )}
            </MotionBox>
          </Rnd>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChat;
