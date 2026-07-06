import { Schema, model, Document } from 'mongoose';

export interface ITestimonial extends Document {
  clientName: string;
  role: string;
  company: string;
  text: string;
  rating: number;
  videoUrl?: string;
  avatar: string;
}

const TestimonialSchema = new Schema<ITestimonial>({
  clientName: { type: String, required: true, trim: true },
  role: { type: String, required: true },
  company: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  videoUrl: { type: String },
  avatar: { type: String, required: true }
}, { timestamps: true });

export const Testimonial = model<ITestimonial>('Testimonial', TestimonialSchema);
