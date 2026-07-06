import axios from 'axios';
import { Service, Project, Testimonial, TeamMember, APIResponse } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getServices = async (): Promise<APIResponse<Service[]>> => {
  const response = await api.get<APIResponse<Service[]>>('/services');
  return response.data;
};

export const getServiceBySlug = async (slug: string): Promise<APIResponse<Service>> => {
  const response = await api.get<APIResponse<Service>>(`/services/${slug}`);
  return response.data;
};

export const getPortfolio = async (): Promise<APIResponse<Project[]>> => {
  const response = await api.get<APIResponse<Project[]>>('/portfolio');
  return response.data;
};

export const getProjectById = async (id: string): Promise<APIResponse<Project>> => {
  const response = await api.get<APIResponse<Project>>(`/portfolio/${id}`);
  return response.data;
};

export const getTestimonials = async (): Promise<APIResponse<Testimonial[]>> => {
  const response = await api.get<APIResponse<Testimonial[]>>('/testimonials');
  return response.data;
};

export const getTeam = async (): Promise<APIResponse<TeamMember[]>> => {
  const response = await api.get<APIResponse<TeamMember[]>>('/team');
  return response.data;
};

export const submitContact = async (data: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}): Promise<APIResponse<any>> => {
  const response = await api.post<APIResponse<any>>('/contact', data);
  return response.data;
};

export const subscribeNewsletter = async (email: string): Promise<APIResponse<any>> => {
  const response = await api.post<APIResponse<any>>('/newsletter', { email });
  return response.data;
};

export default api;
