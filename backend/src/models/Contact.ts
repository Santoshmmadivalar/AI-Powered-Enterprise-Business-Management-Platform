import { Schema, model, Document } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

const ContactMessageSchema = new Schema<IContactMessage>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  company: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true }
}, { timestamps: true });

export const ContactMessage = model<IContactMessage>('ContactMessage', ContactMessageSchema);
