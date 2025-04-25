
import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PlanCardProps {
  plan: {
    label: string;
    price: string;
    subtitle: string;
    priceId: string;
    features: string[];
  };
  selected: boolean;
  onSelect: () => void;
  loading: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  selected,
  onSelect,
  loading,
}) => {
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
};
