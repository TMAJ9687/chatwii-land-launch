
import React from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardElement } from "@stripe/react-stripe-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayPalButton } from "./PayPalButton";

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

interface PaymentSectionProps {
  selectedPlanIdx: number;
  planDetails: Array<{
    label: string;
    price: string;
    subtitle: string;
    priceId: string;
    features: string[];
  }>;
  loading: boolean;
  onPaymentMethodChange: (method: 'stripe' | 'paypal') => void;
  onPayment: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  selectedPlanIdx,
  planDetails,
  loading,
  onPaymentMethodChange,
  onPayment,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
      
      <Tabs defaultValue="stripe" onValueChange={(v) => onPaymentMethodChange(v as 'stripe' | 'paypal')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Credit Card
          </TabsTrigger>
          <TabsTrigger value="paypal">
            PayPal
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stripe" className="space-y-4">
          <div className="border p-4 rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
        </TabsContent>
        
        <TabsContent value="paypal">
          <PayPalButton plan={planDetails[selectedPlanIdx]} disabled={loading} />
        </TabsContent>
      </Tabs>
      
      <Button 
        onClick={onPayment} 
        className="w-full mt-4 bg-chatwii-orange hover:bg-chatwii-peach"
        disabled={loading}
      >
        {loading ? "Processing..." : `Pay ${planDetails[selectedPlanIdx].price}`}
      </Button>
    </div>
  );
};
