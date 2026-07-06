import { Request, Response, NextFunction } from 'express';
import { ContactMessage } from '../models/Contact';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  company: z.string().optional(),
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

export const submitContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = contactSchema.parse(req.body);
    const newMessage = new ContactMessage(validatedData);
    await newMessage.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Your enquiry has been submitted successfully. A representative will contact you shortly.',
      data: newMessage 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message })) 
      });
      return;
    }
    next(error);
  }
};
