
import React, { createContext, useContext, useState } from 'react';

interface MockModeContextType {
  isMockMode: boolean;
  enableMockMode: () => void;
  disableMockMode: () => void;
}

const MockModeContext = createContext<MockModeContextType>({
  isMockMode: false,
  enableMockMode: () => {},
  disableMockMode: () => {},
});

export const useMockMode = () => useContext(MockModeContext);

export const MockModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMockMode, setIsMockMode] = useState(() => {
    // Check if mock mode was previously enabled
    return localStorage.getItem('mock_mode') === 'true';
  });

  const enableMockMode = () => {
    localStorage.setItem('mock_mode', 'true');
    setIsMockMode(true);
  };

  const disableMockMode = () => {
    localStorage.setItem('mock_mode', 'false');
    setIsMockMode(false);
  };

  return (
    <MockModeContext.Provider value={{ isMockMode, enableMockMode, disableMockMode }}>
      {children}
    </MockModeContext.Provider>
  );
};
