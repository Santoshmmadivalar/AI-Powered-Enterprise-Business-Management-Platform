'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, Heart } from 'lucide-react';
import { LinkedinIcon, TwitterIcon, GithubIcon } from '../ui/BrandIcons';
import { subscribeNewsletter } from '../../services/api';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await subscribeNewsletter(email);
      if (res.success) {
        setStatus('success');
        setMessage(res.message || 'Thank you for subscribing!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(res.message || 'Subscription failed.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <footer className="bg-background border-t border-border/40 text-foreground pt-20 pb-10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <span className="font-extrabold text-2xl tracking-tight text-foreground flex items-center">
                OUTPRO
                <span className="text-primary font-bold text-3xl">.</span>
                <span className="text-primary font-medium text-lg self-end tracking-wider ml-0.5">INDIA</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Outpro.India is a premier digital transformation agency. We engineer custom high-performance applications, craft user experiences, and establish reliable cloud architectures for businesses worldwide.
            </p>
            <div className="flex space-x-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors" aria-label="LinkedIn">
                <LinkedinIcon size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors" aria-label="Twitter">
                <TwitterIcon size={16} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-white transition-colors" aria-label="GitHub">
                <GithubIcon size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h3 className="font-bold text-base mb-6 text-foreground">Services</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/services/custom-software-development" className="text-muted-foreground hover:text-primary transition-colors">
                  Custom Software
                </Link>
              </li>
              <li>
                <Link href="/services/web-ecommerce-development" className="text-muted-foreground hover:text-primary transition-colors">
                  Web & E-Commerce
                </Link>
              </li>
              <li>
                <Link href="/services/ui-ux-design" className="text-muted-foreground hover:text-primary transition-colors">
                  UI/UX Design
                </Link>
              </li>
              <li>
                <Link href="/services/cloud-solutions" className="text-muted-foreground hover:text-primary transition-colors">
                  Cloud & DevOps
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Info */}
          <div>
            <h3 className="font-bold text-base mb-6 text-foreground">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3 text-muted-foreground">
                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                <span>
                  Plot No. 42, Tech Hub Sector V, <br />
                  Kolkata, West Bengal 700091, India
                </span>
              </li>
              <li className="flex items-center space-x-3 text-muted-foreground">
                <Phone size={16} className="text-primary shrink-0" />
                <span>+91 (033) 4004-9800</span>
              </li>
              <li className="flex items-center space-x-3 text-muted-foreground">
                <Mail size={16} className="text-primary shrink-0" />
                <span>solutions@outpro.in</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-6">
            <h3 className="font-bold text-base text-foreground">Subscribe</h3>
            <p className="text-muted-foreground text-sm">
              Stay ahead of digital trends. Sign up for our weekly technical newsletter.
            </p>
            <form onSubmit={handleSubscribe} className="relative flex items-center">
              <input
                type="email"
                placeholder="Business Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                required
                className="w-full bg-secondary text-foreground text-sm pl-4 pr-12 py-3 rounded-lg border border-border/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className="absolute right-2 p-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50"
                aria-label="Send"
              >
                <Send size={14} />
              </button>
            </form>
            {message && (
              <p
                className={cn(
                  'text-xs font-semibold mt-2',
                  status === 'success' ? 'text-emerald-500' : 'text-rose-500'
                )}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Outpro.India. All rights reserved. | Made by Santosh M M</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
