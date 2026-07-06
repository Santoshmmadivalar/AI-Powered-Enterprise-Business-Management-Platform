import { Schema, model, Document } from 'mongoose';

export interface ITeamMember extends Document {
  name: string;
  role: string;
  bio: string;
  image: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  order: number;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true },
  bio: { type: String, required: true },
  image: { type: String, required: true },
  socials: {
    linkedin: { type: String },
    twitter: { type: String },
    github: { type: String }
  },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const TeamMember = model<ITeamMember>('TeamMember', TeamMemberSchema);
