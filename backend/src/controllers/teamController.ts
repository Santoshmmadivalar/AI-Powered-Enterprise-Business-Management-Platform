import { Request, Response, NextFunction } from 'express';
import { TeamMember } from '../models/Team';

export const getTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await TeamMember.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};
