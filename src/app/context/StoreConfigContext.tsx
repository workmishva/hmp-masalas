import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchConfig, updateConfigApi } from '../services/configApi';

interface StoreConfig {
  whatsappNumber: string;
  storeLatitude: number | null;
  storeLongitude: number | null;
  freeShippingRadiusKm: number;
  outsideRadiusShippingCharge: number;
  upiPayment: boolean;
}

interface StoreConfigContextType {
  config: StoreConfig;
  updateConfig: (newConfig: Partial<StoreConfig>) => Promise<void>;
}

const StoreConfigContext = createContext<StoreConfigContextType | null>(null);

const DEFAULT_CONFIG: StoreConfig = {
  whatsappNumber: '917984904156',
  storeLatitude: null,
  storeLongitude: null,
  freeShippingRadiusKm: 10,
  outsideRadiusShippingCharge: 50,
  upiPayment: false,
};

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchConfig();
        setConfig(data);
      } catch (e) {
        console.error("Failed to fetch store config from backend", e);
      }
    };
    loadConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<StoreConfig>) => {
    try {
      const updated = await updateConfigApi(newConfig);
      setConfig(updated);
    } catch (e) {
      console.error("Failed to update store config", e);
      throw e;
    }
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
