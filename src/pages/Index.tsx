
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Automatically redirect to the chat page
  return <Navigate to="/chat" replace />;
};

export default Index;
