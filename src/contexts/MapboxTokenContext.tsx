
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapboxTokenContextType {
  token: string;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
  updateToken: (newToken: string) => void;
}

// This is a public token - it's safe to be in code
const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1kZXYiLCJhIjoiY2xzOXJ0cWt2MGE5cDJrcGF0cDR2MXltbiJ9.7J83dSH6KZ_367YgfrmTJg';

const MapboxTokenContext = createContext<MapboxTokenContextType | null>(null);

export const useMapboxToken = () => {
  const context = useContext(MapboxTokenContext);
  if (!context) {
    throw new Error('useMapboxToken must be used within a MapboxTokenProvider');
  }
  return context;
};

interface MapboxTokenProviderProps {
  children: ReactNode;
}

export const MapboxTokenProvider: React.FC<MapboxTokenProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string>(DEFAULT_MAPBOX_TOKEN);
  const [isValid, setIsValid] = useState<boolean>(true);

  const updateToken = (newToken: string) => {
    setToken(newToken);
    // Reset validity when token changes
    setIsValid(true); 
  };

  return (
    <MapboxTokenContext.Provider
      value={{
        token,
        isValid,
        setIsValid,
        updateToken,
      }}
    >
      {children}
    </MapboxTokenContext.Provider>
  );
};
