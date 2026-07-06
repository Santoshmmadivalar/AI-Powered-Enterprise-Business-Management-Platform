import { Schema, model, Document } from 'mongoose';

export interface INewsletterSubscriber extends Document {
  email: string;
  active: boolean;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const NewsletterSubscriber = model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema);
