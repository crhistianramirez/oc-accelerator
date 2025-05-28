import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  Icon,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { Payments } from "ordercloud-javascript-sdk";
import { useState } from "react";

type FakePaymentFormProps = {
  order: { ID: string; Total: number };
  onPaymentAccepted?: () => void;
};

const generateDemoCardValues = () => {
  const cardNumber =
    "4" +
    Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join("");
  const futureDate = new Date();
  futureDate.setFullYear(
    futureDate.getFullYear() + Math.floor(Math.random() * 5) + 1
  );
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const year = String(futureDate.getFullYear()).slice(-2);
  const expiration = `${month}/${year}`;
  const cvv = String(Math.floor(100 + Math.random() * 900));
  return { cardNumber, expiration, cvv };
};

export const FakePaymentForm = ({
  order,
  onPaymentAccepted,
}: FakePaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiration, setExpiration] = useState("");
  const [cvv, setCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const orderID = order.ID;
      const amount = order.Total;
      const now = new Date().toISOString();

      const payment = await Payments.Create("Outgoing", orderID, {
        Type: "CreditCard",
        Amount: amount,
        Accepted: true,
      });

      await Payments.CreateTransaction("Outgoing", orderID, payment.ID, {
        Type: "CreditCard",
        Amount: amount,
        Succeeded: true,
        DateExecuted: now,
      });

      setSubmitted(true);
      onPaymentAccepted?.(); // <-- Notify parent
    } catch (error) {
      alert("Something went wrong while submitting payment.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const autofillDemoValues = () => {
    const demo = generateDemoCardValues();
    setCardNumber(demo.cardNumber);
    setExpiration(demo.expiration);
    setCvv(demo.cvv);
  };

  const isDisabled = submitting || submitted;

  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired isDisabled={isDisabled}>
        <FormLabel>Card Number</FormLabel>
        <Input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
      </FormControl>
      <HStack spacing={4}>
        <FormControl isRequired isDisabled={isDisabled}>
          <FormLabel>Expiration (MM/YY)</FormLabel>
          <Input
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
          />
        </FormControl>
        <FormControl isRequired isDisabled={isDisabled}>
          <FormLabel>CVV</FormLabel>
          <Input value={cvv} onChange={(e) => setCvv(e.target.value)} />
        </FormControl>
      </HStack>

      {!submitted ? (
        <HStack spacing={4}>
          <Button
            onClick={autofillDemoValues}
            variant="outline"
            isDisabled={isDisabled}
          >
            Generate Demo Card
          </Button>
          <Button
            onClick={handleSubmit}
            colorScheme="primary"
            isLoading={submitting}
            loadingText="Submitting"
          >
            Submit Payment
          </Button>
        </HStack>
      ) : (
        <HStack spacing={2} color="green.500">
          <Icon as={CheckCircleIcon} boxSize={6} />
          <Text fontWeight="medium">Payment Accepted</Text>
        </HStack>
      )}
    </VStack>
  );
};
