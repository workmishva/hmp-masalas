import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StoreConfig {
  whatsappNumber: string;
  storeLatitude: number | null;
  storeLongitude: number | null;
  freeShippingRadiusKm: number;
  outsideRadiusShippingCharge: number;
}

interface StoreConfigContextType {
  config: StoreConfig;
  updateConfig: (newConfig: Partial<StoreConfig>) => void;
}

const StoreConfigContext = createContext<StoreConfigContextType | null>(null);

const DEFAULT_CONFIG: StoreConfig = {
  whatsappNumber: '917984904156',
  storeLatitude: null,
  storeLongitude: null,
  freeShippingRadiusKm: 10,
  outsideRadiusShippingCharge: 50,
};

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('storeConfig');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('storeConfig', JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: Partial<StoreConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <StoreConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const context = useContext(StoreConfigContext);
  if (!context) {
    throw new Error('useStoreConfig must be used within a StoreConfigProvider');
  }
  return context;
}
