import { Request, Response } from 'express';
import StoreConfig from '../models/StoreConfig';

const DEFAULT_CONFIG = {
  whatsappNumber: '917984904156',
  storeLatitude: null,
  storeLongitude: null,
  freeShippingRadiusKm: 10,
  outsideRadiusShippingCharge: 50,
  upiPayment: false,
};

export const getConfig = async (req: Request, res: Response) => {
  try {
    let config = await StoreConfig.findOne();
    if (!config) {
      config = new StoreConfig(DEFAULT_CONFIG);
      await config.save();
    }
    res.status(200).json(config);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error fetching store config' });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    let config = await StoreConfig.findOne();
    if (!config) {
      config = new StoreConfig(DEFAULT_CONFIG);
    }
    
    Object.assign(config, req.body);
    await config.save();
    
    res.status(200).json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
