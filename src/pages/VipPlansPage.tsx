import React, { useState, useEffect, useRef } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Check, X, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

function PlanCard({
  plan,
  selected,
  onSelect,
  loading,
}: {
  plan: typeof PLAN_DETAILS[0];
  selected: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg border-2 ${selected ? "border-chatwii-orange" : "border-gray-100"} p-6 w-full max-w-xs mx-auto space-y-4 flex flex-col justify-between`}>
      <div>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{plan.price}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{plan.subtitle}</div>
        <ul className="space-y-2 mb-2">
          {plan.features.map((feat) =>
            <li key={feat} className="flex items-center gap-2 text-gray-800 dark:text-gray-100 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> {feat}
            </li>
          )}
        </ul>
      </div>
      <Button
        className={`w-full ${selected ? "bg-chatwii-orange" : "bg-gray-200 dark:bg-gray-700"} hover:bg-chatwii-peach text-white mt-3`}
        onClick={onSelect}
        disabled={loading}
      >
        {selected ? "Selected" : "Select Plan"}
      </Button>
    </div>
  );
}

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

const PayPalButton = ({ plan, disabled }: { plan: typeof PLAN_DETAILS[0], disabled: boolean }) => {
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!window.paypal && !document.querySelector('script[src*="paypal"]')) {
      const script = document.createElement('script');
      script.src = "https://www.paypal.com/sdk/js?client-id=test&currency=USD";
      script.async = true;
      script.dataset.paypalScript = 'true';
      document.body.appendChild(script);
    }
    
    return () => {
    };
  }, []);

  return (
    <div className={`border p-4 rounded-lg ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="text-center mb-4" ref={paypalContainerRef}>PayPal button would render here</div>
      <Button 
        className="w-full bg-[#0070ba] hover:bg-[#005ea6]" 
        disabled={disabled}
        onClick={() => toast.info("PayPal integration would process payment here")}
      >
        Pay with PayPal
      </Button>
    </div>
  );
};

const VipPlansPage: React.FC = () => {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [registrationData, setRegistrationData] = useState<{email: string, nickname: string} | null>(null);
  const stripe = useStripe();
  const elements = useElements();
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
      if (paymentMethod === 'stripe' && stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        
        if (!cardElement) {
          throw new Error("Card element not found");
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) {
          throw error;
        }

        await createVipAccount(registrationData.email, registrationData.nickname, PLAN_DETAILS[selectedPlanIdx].label);
        
        localStorage.removeItem('vip_registration_email');
        localStorage.removeItem('vip_registration_nickname');
        
        toast.success("Payment successful!");
        navigate('/vip/profile-setup');
      } else if (paymentMethod === 'paypal') {
        await createVipAccount(registrationData.email, registrationData.nickname, PLAN_DETAILS[selectedPlanIdx].label);
        
        localStorage.removeItem('vip_registration_email');
        localStorage.removeItem('vip_registration_nickname');
        
        toast.success("PayPal payment successful!");
        navigate('/vip/profile-setup');
      }
    } catch (error: any) {
      toast.error(`Payment failed: ${error.message || "Unknown error"}`);
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createVipAccount = async (email: string, nickname: string, plan: string) => {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle();
    
    if (existingUser) {
      throw new Error("User already exists with this nickname");
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("No authenticated session");
    }

    const userId = session.user.id;
    
    let endDate = new Date();
    if (plan === 'Monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === '6 Months') {
      endDate.setMonth(endDate.getMonth() + 6);
    } else { // Yearly
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    await supabase
      .from('profiles')
      .insert({
        id: userId,
        nickname,
        role: 'vip',
        vip_status: true,
      });

    await supabase
      .from('vip_subscriptions')
      .insert({
        user_id: userId,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        payment_provider: paymentMethod,
        subscription_plan: plan,
      });
    
    return true;
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
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        
        <Tabs defaultValue="stripe" onValueChange={(v) => handlePaymentMethodChange(v as 'stripe' | 'paypal')}>
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
            <PayPalButton plan={PLAN_DETAILS[selectedPlanIdx]} disabled={loading} />
          </TabsContent>
        </Tabs>
        
        <Button 
          onClick={handlePayment} 
          className="w-full mt-4 bg-chatwii-orange hover:bg-chatwii-peach"
          disabled={loading}
        >
          {loading ? "Processing..." : `Pay ${PLAN_DETAILS[selectedPlanIdx].price}`}
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 text-center max-w-md mx-auto mt-4">
        By proceeding with payment, you agree to our terms of service and privacy policy.
      </div>
    </div>
  );
};

export default VipPlansPage;
