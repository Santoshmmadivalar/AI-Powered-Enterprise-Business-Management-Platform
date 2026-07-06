import { Request, Response, NextFunction } from 'express';
import { Service } from '../models/Service';

export const getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const services = await Service.find({}, 'name slug icon shortDesc');
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

export const getServiceBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const service = await Service.findOne({ slug });
    
    if (!service) {
      res.status(404).json({ success: false, message: `Service not found with slug: ${slug}` });
      return;
    }
    
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};
