
import { useNavigate } from 'react-router-dom';

export const ChatButton = () => {
  const navigate = useNavigate();
  
  const handleStartChat = () => {
    navigate('/chat');
  };
  
  return (
    <button
      onClick={handleStartChat}
      className="w-full bg-chatwii-peach hover:bg-opacity-90 text-white py-3 rounded-md font-medium transition-colors text-base shadow-sm hover:shadow-md"
    >
      Start Chat
    </button>
  );
};
