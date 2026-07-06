import { Schema, model, Document } from 'mongoose';

export interface IFAQ {
  question: string;
  answer: string;
}

export interface IService extends Document {
  name: string;
  slug: string;
  icon: string;
  shortDesc: string;
  longDesc: string;
  features: string[];
  benefits: string[];
  techStack: string[];
  faqs: IFAQ[];
}

const FAQSchema = new Schema<IFAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const ServiceSchema = new Schema<IService>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  icon: { type: String, required: true },
  shortDesc: { type: String, required: true },
  longDesc: { type: String, required: true },
  features: [{ type: String }],
  benefits: [{ type: String }],
  techStack: [{ type: String }],
  faqs: [FAQSchema]
}, { timestamps: true });

export const Service = model<IService>('Service', ServiceSchema);
