import { Request, Response, NextFunction } from 'express';
import { NewsletterSubscriber } from '../models/Subscriber';
import { z } from 'zod';

const subscriberSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const subscribeNewsletter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = subscriberSchema.parse(req.body);
    const { email } = validatedData;
    
    // Check if already subscribed
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      if (existing.active) {
        res.status(400).json({ success: false, message: 'This email is already subscribed to our newsletter.' });
        return;
      }
      // Re-activate subscription
      existing.active = true;
      await existing.save();
      res.status(200).json({ success: true, message: 'Welcome back! Your subscription has been reactivated.' });
      return;
    }
    
    const newSubscriber = new NewsletterSubscriber({ email });
    await newSubscriber.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Thank you for subscribing to the Outpro.India newsletter!',
      data: newSubscriber 
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
