import { Button } from "@chakra-ui/react";
import { useMemo } from "react";
import { PAYMENT_PROVIDER, PAYMENT_PROVIDERS } from "../../../constants";

type CartPaymentPanelProps = {
  submitOrder: () => void;
  submitting: boolean;
};

const PaymentMapper = (provider: PAYMENT_PROVIDERS) => {
  switch (provider) {
    default:
      null;
  }
};

export const CartPaymentPanel = ({
  submitOrder,
  submitting,
}: CartPaymentPanelProps) => {
  const PaymentElement = useMemo(() => {
    return PaymentMapper(PAYMENT_PROVIDER);
  }, []);

  return (
    <>
      {PaymentElement}

      <Button
        alignSelf="flex-end"
        onClick={submitOrder}
        mt={6}
        isDisabled={submitting}
      >
        {submitting ? "Submitting" : "Submit Order"}
      </Button>
    </>
  );
};
