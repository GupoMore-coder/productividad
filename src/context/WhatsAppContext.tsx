import React, { createContext, useContext, useState, useCallback } from 'react';

interface WhatsAppContextType {
  openWhatsApp: (phone: string, message: string) => void;
  closeWhatsApp: () => void;
  state: {
    isOpen: boolean;
    phone: string;
    message: string;
  };
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    isOpen: false,
    phone: '',
    message: '',
  });

  const openWhatsApp = useCallback((phone: string, message: string) => {
    setState({
      isOpen: true,
      phone,
      message,
    });
  }, []);

  const closeWhatsApp = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <WhatsAppContext.Provider value={{ openWhatsApp, closeWhatsApp, state }}>
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};
