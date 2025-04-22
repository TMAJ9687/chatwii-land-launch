
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();

  // Placeholder for future chat functionality
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-3xl font-semibold mb-4">Chat Coming Soon</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          This page will host the chat functionality in future implementations.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-chatwii-peach hover:bg-opacity-90 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
