import { Schema, model, Document, Types } from 'mongoose';

export interface IKPI {
  label: string;
  value: string;
}

export interface IClientFeedback {
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerRole: string;
}

export interface IProject extends Document {
  title: string;
  slug: string;
  category: Types.ObjectId;
  description: string;
  images: string[];
  challenge: string;
  solution: string;
  kpis: IKPI[];
  clientFeedback: IClientFeedback;
  technologies: string[];
  clientName: string;
}

const KPISchema = new Schema<IKPI>({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const ClientFeedbackSchema = new Schema<IClientFeedback>({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  reviewerName: { type: String, required: true },
  reviewerRole: { type: String, required: true }
}, { _id: false });

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  challenge: { type: String, required: true },
  solution: { type: String, required: true },
  kpis: [KPISchema],
  clientFeedback: ClientFeedbackSchema,
  technologies: [{ type: String }],
  clientName: { type: String, required: true }
}, { timestamps: true });

export const Project = model<IProject>('Project', ProjectSchema);
