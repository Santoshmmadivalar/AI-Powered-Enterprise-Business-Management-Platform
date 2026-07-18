'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Code, Globe, Cloud } from 'lucide-react';
import { getServices } from '../../services/api';
import { Service } from '../../types';
import { fallbackServices } from '../../constants/fallbackData';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { IconRenderer } from '../../components/ui/IconRenderer';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await getServices();
        if (res.success && res.data.length > 0) {
          setServices(res.data);
        } else {
          setServices(fallbackServices);
        }
      } catch (error) {
        console.warn('Failed to load services from API. Falling back to default services.', error);
        setServices(fallbackServices);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <Breadcrumbs />

      {/* Page Header */}
      <section className="max-w-3xl space-y-6 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          <Sparkles size={12} />
          <span>Our Solutions Catalog</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Elite Digital Capabilities Engineered for Enterprise Success
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Explore our expertises spanning custom microservices databases, headless online checkout systems, interactive wireframes, and secure multi-zone cloud operations.
        </p>
      </section>

      {/* Services Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, idx) => <CardSkeleton key={idx} />)
          : services.map((service) => (
              <div
                key={service._id}
                className="group flex flex-col justify-between p-8 rounded-2xl border border-border/40 bg-card hover:bg-accent/30 transition-all duration-300 hover:shadow-2xl glass-panel"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <IconRenderer name={service.icon} size={22} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-secondary px-2.5 py-1 rounded">
                      Capabilities
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {service.name}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.shortDesc}
                    </p>
                  </div>

                  {service.features && (
                    <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-4 border-t border-border/20">
                      {service.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5">
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/20">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    TypeScript • Next-Gen Ready
                  </span>
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/95 rounded-lg transition-all duration-200"
                  >
                    View Details
                    <ArrowRight size={12} className="ml-1.5" />
                  </Link>
                </div>
              </div>
            ))}
      </section>

      {/* final banner CTA */}
      <section className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 md:p-12 text-center text-white border border-white/10 shadow-xl space-y-6">
        <h3 className="text-2xl md:text-3xl font-extrabold">Need a Custom Tailored Software Architecture?</h3>
        <p className="text-white/80 text-sm max-w-xl mx-auto leading-relaxed">
          If your specifications extend beyond standard service offerings, our senior architect teams are ready to draft a customized delivery workflow layout.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold bg-white text-indigo-950 hover:bg-white/95 rounded-xl transition-all"
        >
          Consult An Architect
          <ArrowRight size={16} className="ml-2" />
        </Link>
      </section>
    </div>
  );
}
