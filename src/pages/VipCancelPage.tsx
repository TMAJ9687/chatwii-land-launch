
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const VipCancelPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-3xl font-bold text-red-400 mb-4">Payment Cancelled</div>
        <div className="mb-3 text-gray-800 dark:text-white">
          Your payment was not completed.
        </div>
        <div className="mb-6 text-sm text-gray-500">
          You can try subscribing again at any time. <br/>
          If you believe this is an error, contact support.
        </div>
        <Button className="w-full bg-chatwii-peach" onClick={() => navigate("/vip-plans")}>Return to Plans</Button>
      </div>
    </div>
  );
};

export default VipCancelPage;
