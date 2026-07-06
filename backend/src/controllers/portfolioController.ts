import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export const getPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category) {
      query = { category };
    }
    
    const projects = await Project.find(query).populate('category', 'name slug');
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let project;
    
    if (mongoose.isValidObjectId(id)) {
      project = await Project.findById(id).populate('category', 'name slug');
    } else {
      project = await Project.findOne({ slug: id }).populate('category', 'name slug');
    }
    
    if (!project) {
      res.status(404).json({ success: false, message: `Project not found with identifier: ${id}` });
      return;
    }
    
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};
