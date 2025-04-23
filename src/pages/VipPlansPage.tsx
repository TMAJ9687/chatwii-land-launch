import React, { useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
        className={`w-full bg-chatwii-orange hover:bg-chatwii-peach text-white mt-3`}
        onClick={onSelect}
        disabled={loading}
      >{loading && selected ? "Redirecting..." : "Get Started"}</Button>
    </div>
  );
}

const VipPlansPage: React.FC = () => {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(2);
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const navigate = useNavigate();

  const handlePlanSwitch = (direction: "prev" | "next") => {
    setSelectedPlanIdx((idx) =>
      direction === "next"
        ? (idx + 1) % PLAN_DETAILS.length
        : (idx - 1 + PLAN_DETAILS.length) % PLAN_DETAILS.length
    );
  };

  const handleSubscribe = async () => {
    navigate("/vip/register");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-100 dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
        Choose your <span className="text-chatwii-peach">VIP Plan</span>
      </h1>
      <div className="flex items-center mb-8 gap-2">
        <Button variant="ghost" size="icon" onClick={() => handlePlanSwitch("prev")}>
          <span className="text-xl">&larr;</span>
        </Button>
        <div style={{ minWidth: 320 }}>
          <PlanCard
            plan={PLAN_DETAILS[selectedPlanIdx]}
            selected={true}
            onSelect={handleSubscribe}
            loading={loading}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => handlePlanSwitch("next")}>
          <span className="text-xl">&rarr;</span>
        </Button>
      </div>
      <div className="text-xs text-gray-500 text-center max-w-md mx-auto">
        Powered by Stripe. Your payment is processed securely via Stripe. <br />
        <b>To enable real payments, replace:</b>
        <ul className="mt-1 list-disc ml-4 text-left">
          <li>Stripe Publishable Key in Elements setup</li>
          <li>Price IDs in this page (see <code>PRICEIDS</code> const)</li>
          <li>Implement backend endpoint <code>/create-checkout-session</code> to talk to Stripe</li>
          <li>Add a backend webhook to update VIP status after payment!</li>
        </ul>
      </div>
    </div>
  );
};

export default VipPlansPage;
