import { Button } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { PAYMENT_PROVIDER, PAYMENT_PROVIDERS } from "../../../constants";
import { BlueSnap } from "../Payment/BlueSnap";
import { CardConnect } from "../Payment/CardConnect";
import { PayPal } from "../Payment/PayPal";
import { Stripe } from "../Payment/Stripe";
import { FakePaymentForm } from "../Payment/FakePaymentForm";

type CartPaymentPanelProps = {
  submitOrder: () => void;
  submitting: boolean;
  orderID: string;
  orderTotal: number;
};

export const CartPaymentPanel = ({
  submitOrder,
  submitting,
  orderID,
  orderTotal,
}: CartPaymentPanelProps) => {
  const [paymentAccepted, setPaymentAccepted] = useState(false);

  const PaymentElement = useMemo(() => {
    const provider = PAYMENT_PROVIDER || PAYMENT_PROVIDERS.FAKE_GATEWAY;

    const PaymentMapper = (provider: PAYMENT_PROVIDERS) => {
      switch (provider) {
        case PAYMENT_PROVIDERS.STRIPE:
          return <Stripe />;
        case PAYMENT_PROVIDERS.CARD_CONNECT:
          return <CardConnect />;
        case PAYMENT_PROVIDERS.BLUESNAP:
          return <BlueSnap />;
        case PAYMENT_PROVIDERS.PAYPAL:
          return <PayPal />;
        case PAYMENT_PROVIDERS.FAKE_GATEWAY:
          return (
            <FakePaymentForm
              order={{ ID: orderID, Total: orderTotal }}
              onPaymentAccepted={() => setPaymentAccepted(true)}
            />
          );
        default:
          return null;
      }
    };

    return PaymentMapper(provider);
  }, [orderID, orderTotal]);

  return (
    <>
      {PaymentElement}

      <Button
        alignSelf="flex-end"
        onClick={submitOrder}
        mt={6}
        isDisabled={submitting || !paymentAccepted}
      >
        {submitting ? "Submitting" : "Submit Order"}
      </Button>
    </>
  );
};
