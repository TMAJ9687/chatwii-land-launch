
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PlanCard } from "@/components/vip/PlanCard";
import { PaymentSection } from "@/components/vip/PaymentSection";

const PRICEIDS = {
  YEARLY: "price_YEARLY",
  SIX_MONTHS: "price_6MONTHS",
  MONTHLY: "price_MONTHLY",
};

const VIP_PRICES = {
  monthly: 4.99,
  sixMonths: 24.95,
  yearly: 35.99,
};

const PLAN_DETAILS = [
  {
    label: "Monthly",
    price: `$${VIP_PRICES.monthly}`,
    subtitle: "Billed monthly.",
    priceId: PRICEIDS.MONTHLY,
    features: [
      "Send unlimited photos",
      "Send unlimited voice messages",
      "Chat history view",
      "Customer Support",
      "Customized avatars",
      "Appear at the top of the list",
      "Ad free",
      "React, reply, edit, unsend messages",
      "View message status",
      "Hide your own message status",
      "Control your online status",
    ],
  },
  {
    label: "6 Months",
    price: `$${VIP_PRICES.sixMonths}`,
    subtitle: "Billed every 6 months.",
    priceId: PRICEIDS.SIX_MONTHS,
    features: [
      "Send unlimited photos",
      "Send unlimited voice messages",
      "Chat history view",
      "Customer Support",
      "Customized avatars",
      "Appear at the top of the list",
      "Ad free",
      "React, reply, edit, unsend messages",
      "View message status",
      "Hide your own message status",
      "Control your online status",
    ],
  },
  {
    label: "Yearly",
    price: `$${VIP_PRICES.yearly}`,
    subtitle: "Billed annually.",
    priceId: PRICEIDS.YEARLY,
    features: [
      "Send unlimited photos",
      "Send unlimited voice messages",
      "Chat history view",
      "Customer Support",
      "Customized avatars",
      "Appear at the top of the list",
      "Ad free",
      "React, reply, edit, unsend messages",
      "View message status",
      "Hide your own message status",
      "Control your online status",
    ],
  },
];

const VipPlansPage: React.FC = () => {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [registrationData, setRegistrationData] = useState<{email: string, nickname: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('vip_registration_email');
    const nickname = localStorage.getItem('vip_registration_nickname');
    
    if (email && nickname) {
      setRegistrationData({ email, nickname });
    } else {
      navigate('/vip/register');
    }
  }, [navigate]);

  const handlePlanSelect = (idx: number) => {
    setSelectedPlanIdx(idx);
  };

  const handlePaymentMethodChange = (method: 'stripe' | 'paypal') => {
    setPaymentMethod(method);
  };

  const handlePayment = async () => {
    if (!registrationData) {
      toast.error("Registration data not found");
      navigate('/vip/register');
      return;
    }

    setLoading(true);

    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      localStorage.removeItem('vip_registration_email');
      localStorage.removeItem('vip_registration_nickname');
      
      toast.success("Payment successful!");
      navigate('/vip/profile-setup');
    } catch (error: any) {
      toast.error(`Payment failed: ${error.message || "Unknown error"}`);
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/");
  };

  if (!registrationData) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4 relative">
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 z-50 focus:outline-none"
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
        Choose your <span className="text-chatwii-peach">VIP Plan</span>
      </h1>

      <Carousel
        className="w-full max-w-xs mb-8"
        opts={{
          align: "center",
          loop: true
        }}
      >
        <CarouselContent>
          {PLAN_DETAILS.map((plan, idx) => (
            <CarouselItem key={plan.label} onClick={() => handlePlanSelect(idx)}>
              <PlanCard
                plan={plan}
                selected={selectedPlanIdx === idx}
                onSelect={() => handlePlanSelect(idx)}
                loading={loading}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-0 -translate-x-full" />
        <CarouselNext className="absolute right-0 translate-x-full" />
      </Carousel>
      
      <PaymentSection
        selectedPlanIdx={selectedPlanIdx}
        planDetails={PLAN_DETAILS}
        loading={loading}
        onPaymentMethodChange={handlePaymentMethodChange}
        onPayment={handlePayment}
      />
      
      <div className="text-xs text-gray-500 text-center max-w-md mx-auto mt-4">
        By proceeding with payment, you agree to our terms of service and privacy policy.
      </div>
    </div>
  );
};

export default VipPlansPage;
