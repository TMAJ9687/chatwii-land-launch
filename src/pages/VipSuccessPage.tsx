
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const VipSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-3xl font-bold text-green-600 mb-4">🎉 Payment Successful!</div>
        <div className="mb-3 text-gray-800 dark:text-white">
          You are now a <span className="text-chatwii-peach font-bold">VIP</span>!
        </div>
        <div className="mb-6 text-sm text-gray-500">
          Thank you for subscribing. Your VIP status will be available shortly.<br/>
          <b>(Backend must handle post-payment status update via webhook).</b>
        </div>
        <Button className="w-full bg-chatwii-peach" onClick={() => navigate("/chat")}>Go to Chat</Button>
      </div>
    </div>
  );
};

export default VipSuccessPage;
