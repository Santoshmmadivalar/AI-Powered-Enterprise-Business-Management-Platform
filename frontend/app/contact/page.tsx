'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { submitContact } from '../../services/api';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  company: z.string().optional(),
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: (zodResolver as any)(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus('loading');
    try {
      const res = await submitContact(data);
      if (res.success) {
        setSubmitStatus('success');
        setStatusMessage(res.message || 'Thank you! Your submission has been saved.');
        reset();
      } else {
        setSubmitStatus('error');
        setStatusMessage(res.message || 'Failed to submit form data.');
      }
    } catch (err: any) {
      setSubmitStatus('error');
      setStatusMessage(err.response?.data?.message || 'Something went wrong. Please check your connections and try again.');
    }
  };

  const contactCards = [
    {
      icon: <Mail className="text-primary" size={20} />,
      title: 'General Support Email',
      value: 'solutions@outpro.in',
      desc: 'Typical reply within 4 business hours.'
    },
    {
      icon: <Phone className="text-primary" size={20} />,
      title: 'Call Solutions Desk',
      value: '+91 (033) 4004-9800',
      desc: 'Available Mon-Fri 9:30 AM - 6:30 PM IST.'
    },
    {
      icon: <Clock className="text-primary" size={20} />,
      title: 'Working Hours',
      value: 'Monday to Friday',
      desc: '9:30 AM to 6:30 PM IST (Asia/Kolkata)'
    }
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <Breadcrumbs />

      {/* Page Header */}
      <section className="max-w-3xl space-y-6 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          <span>Get in Touch</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Let's Design & Build Your Digital Future
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Submit the form below, and our engineering architects will review your project requirements and respond within one business day.
        </p>
      </section>

      {/* Forms & Info Split Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
        {/* Form Container (Col Span 7) */}
        <div className="lg:col-span-7 bg-card border border-border/40 rounded-2xl p-6 md:p-10 shadow-xl glass-panel">
          
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-start space-x-3 text-sm">
              <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-bold">Form Submitted</h4>
                <p className="mt-1 text-xs text-muted-foreground">{statusMessage}</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start space-x-3 text-sm">
              <ShieldAlert className="shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-bold">Submission Failed</h4>
                <p className="mt-1 text-xs text-muted-foreground">{statusMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Your Name *</label>
                <input
                  type="text"
                  placeholder="Rahul Sen"
                  {...register('name')}
                  disabled={submitStatus === 'loading'}
                  className={`w-full bg-secondary text-foreground text-sm px-4 py-3 rounded-lg border focus:outline-none focus:ring-1 transition-all ${
                    errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-border/40 focus:border-primary focus:ring-primary'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Business Email *</label>
                <input
                  type="email"
                  placeholder="rahul@company.in"
                  {...register('email')}
                  disabled={submitStatus === 'loading'}
                  className={`w-full bg-secondary text-foreground text-sm px-4 py-3 rounded-lg border focus:outline-none focus:ring-1 transition-all ${
                    errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-border/40 focus:border-primary focus:ring-primary'
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Company */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  placeholder="Acme Technologies"
                  {...register('company')}
                  disabled={submitStatus === 'loading'}
                  className="w-full bg-secondary text-foreground text-sm px-4 py-3 rounded-lg border border-border/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Subject *</label>
                <input
                  type="text"
                  placeholder="Project Integration Scope"
                  {...register('subject')}
                  disabled={submitStatus === 'loading'}
                  className={`w-full bg-secondary text-foreground text-sm px-4 py-3 rounded-lg border focus:outline-none focus:ring-1 transition-all ${
                    errors.subject ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-border/40 focus:border-primary focus:ring-primary'
                  }`}
                />
                {errors.subject && (
                  <p className="text-xs text-rose-500 font-medium">{errors.subject.message}</p>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Project Specifications *</label>
              <textarea
                rows={5}
                placeholder="Briefly describe the systems scope, target timeframe, and technology preferences..."
                {...register('message')}
                disabled={submitStatus === 'loading'}
                className={`w-full bg-secondary text-foreground text-sm px-4 py-3 rounded-lg border focus:outline-none focus:ring-1 transition-all ${
                  errors.message ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-border/40 focus:border-primary focus:ring-primary'
                }`}
              />
              {errors.message && (
                <p className="text-xs text-rose-500 font-medium">{errors.message.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitStatus === 'loading'}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-200"
            >
              {submitStatus === 'loading' ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
                  Sending Specifications...
                </>
              ) : (
                <>
                  Send Message
                  <Send size={14} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Info Column (Col Span 5) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Info cards list */}
          <div className="space-y-6">
            {contactCards.map((card, idx) => (
              <div key={idx} className="flex space-x-4 p-5 bg-card border border-border/40 rounded-2xl glass-panel">
                <div className="p-3 h-11 w-11 rounded-lg bg-secondary border border-border/40 flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground mb-0.5">{card.title}</h4>
                  <p className="text-sm font-bold text-primary mb-1">{card.value}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Address card */}
          <div className="p-6 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel text-sm">
            <h4 className="font-bold text-base text-foreground flex items-center">
              <MapPin size={18} className="text-primary mr-2" />
              Corporate Headquarters
            </h4>
            <p className="text-muted-foreground leading-relaxed text-xs">
              Plot No. 42, Tech Hub Sector V, <br />
              Kolkata, West Bengal 700091, India
            </p>
            
            {/* Styled Map Container */}
            <div className="relative h-44 bg-secondary/50 rounded-xl overflow-hidden border border-border/20 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:12px_12px] opacity-25" />
              <div className="text-center z-10 p-4">
                <p className="text-xs font-bold text-foreground">Sector V Tech Hub Map View</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Near Salt Lake Electronic Complex
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
