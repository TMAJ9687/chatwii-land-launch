
import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PayPalButtonProps {
  plan: {
    label: string;
    price: string;
    subtitle: string;
    priceId: string;
  };
  disabled: boolean;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ plan, disabled }) => {
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load PayPal script if it doesn't already exist
    if (!window.paypal && !document.querySelector('script[src*="paypal"]')) {
      const script = document.createElement('script');
      script.src = "https://www.paypal.com/sdk/js?client-id=test&currency=USD";
      script.async = true;
      script.dataset.paypalScript = 'true';
      document.body.appendChild(script);
    }
    
    // In a real implementation, we would initialize the PayPal buttons here
    // when the script is loaded and the component is mounted
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handlePayPalClick = () => {
    toast.info(`Processing ${plan.price} payment via PayPal for plan: ${plan.label}`);
    // In a real implementation, this would initiate the PayPal payment flow
  };

  return (
    <div className={`border p-4 rounded-lg ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="text-center mb-4" ref={paypalContainerRef}>PayPal button would render here</div>
      <Button 
        className="w-full bg-[#0070ba] hover:bg-[#005ea6]" 
        disabled={disabled}
        onClick={handlePayPalClick}
      >
        Pay with PayPal
      </Button>
    </div>
  );
};
