'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Cpu, Wrench, Shield, QuestionMarkCircle, ArrowRight } from 'lucide-react';
import { getServiceBySlug, getServices } from '../../../services/api';
import { Service } from '../../../types';
import { fallbackServices } from '../../../constants/fallbackData';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { IconRenderer } from '../../../components/ui/IconRenderer';
import { Accordion } from '../../../components/ui/Accordion';
import { DetailSkeleton } from '../../../components/ui/LoadingSkeleton';

export default function ServiceDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [related, setRelated] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchServiceData = async () => {
      setLoading(true);
      try {
        const [detailRes, listRes] = await Promise.all([
          getServiceBySlug(slug),
          getServices()
        ]);

        if (detailRes.success && detailRes.data) {
          setService(detailRes.data);
        } else {
          const fallback = fallbackServices.find((s) => s.slug === slug);
          if (fallback) setService(fallback);
          else router.push('/services');
        }

        if (listRes.success) {
          setRelated(listRes.data.filter((s) => s.slug !== slug).slice(0, 3));
        } else {
          setRelated(fallbackServices.filter((s) => s.slug !== slug).slice(0, 3));
        }
      } catch (error) {
        console.warn('API error fetching service details. Falling back to local data:', error);
        const fallback = fallbackServices.find((s) => s.slug === slug);
        if (fallback) {
          setService(fallback);
          setRelated(fallbackServices.filter((s) => s.slug !== slug).slice(0, 3));
        } else {
          router.push('/services');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [slug, router]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!service) {
    return null;
  }

  const steps = [
    { num: '01', title: 'Consultation & Scope', desc: 'Detailing system blueprints, requirements mapping, and drafting specifications.' },
    { num: '02', title: 'UX/UI Wireframes', desc: 'Crafting premium interactive interfaces and layout screens for design approvals.' },
    { num: '03', title: 'Development & QA', desc: 'Writing clean modular code, unit validation suites, and automated security evaluations.' },
    { num: '04', title: 'Launch & Optimization', desc: 'Configuring multi-zone server deployments, custom CDN configurations, and speed testing.' }
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6">
        <Breadcrumbs />
        <Link
          href="/services"
          className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Services
        </Link>
      </div>

      {/* Hero Banner */}
      <section className="p-8 md:p-12 bg-gradient-to-br from-card to-accent/20 border border-border/40 rounded-3xl mb-16 relative overflow-hidden glass-panel">
        <div className="max-w-3xl space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-lg">
            <IconRenderer name={service.icon} size={30} />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            {service.name}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {service.shortDesc}
          </p>
        </div>
      </section>

      {/* Core Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
        {/* Long description & Features */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Service Overview</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {service.longDesc || 'Detailed architectural guidelines and engineering workflows deployed dynamically to meet enterprise operations.'}
            </p>
          </div>

          {service.features && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Core Capabilities Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={18} />
                    <span className="text-sm text-foreground/90">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Development roadmap */}
          <div className="space-y-8 pt-8 border-t border-border/20">
            <h2 className="text-xl font-bold text-foreground">Deployment Blueprint Roadmap</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {steps.map((st, idx) => (
                <div key={idx} className="space-y-2 border-l border-primary/20 pl-4 relative">
                  <span className="text-2xl font-black text-primary/20 absolute -top-2 left-4">
                    {st.num}
                  </span>
                  <h4 className="font-bold text-sm text-foreground pt-4">{st.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info (Benefits, Tech Stack, CTA) */}
        <div className="space-y-8">
          {/* Tech Stack */}
          {service.techStack && (
            <div className="p-6 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel">
              <h3 className="font-bold text-base text-foreground flex items-center">
                <Cpu size={18} className="text-primary mr-2" />
                Technology Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {service.techStack.map((tech, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded bg-secondary text-foreground/80 font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          {service.benefits && (
            <div className="p-6 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel">
              <h3 className="font-bold text-base text-foreground flex items-center">
                <Wrench size={18} className="text-primary mr-2" />
                Key Benefits
              </h3>
              <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                {service.benefits.map((ben, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Box */}
          <div className="p-6 bg-primary rounded-2xl text-primary-foreground space-y-4 shadow-xl shadow-primary/10">
            <h3 className="font-bold text-lg">Interested in this service?</h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Contact our engineering consultants to schedule a walkthrough detailing how we address your requirements.
            </p>
            <Link
              href="/contact"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-white text-indigo-950 font-bold rounded-lg shadow-md hover:bg-white/95 transition-all text-xs"
            >
              Get Pricing & Quote
              <ArrowRight size={12} className="ml-1.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Service FAQs */}
      {service.faqs && service.faqs.length > 0 && (
        <section className="mb-24 space-y-8 max-w-4xl">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Support</h2>
            <h3 className="text-2xl font-extrabold text-foreground">Service FAQ Details</h3>
          </div>
          <div className="bg-card border border-border/40 p-6 rounded-2xl glass-panel">
            <Accordion items={service.faqs} />
          </div>
        </section>
      )}

      {/* Related Services */}
      {related.length > 0 && (
        <section className="border-t border-border/20 pt-16 mb-12 space-y-8">
          <h3 className="text-xl font-bold text-foreground">Other Capabilities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((rel) => (
              <Link
                key={rel._id}
                href={`/services/${rel.slug}`}
                className="group p-6 bg-card border border-border/40 rounded-xl hover:border-primary transition-all duration-200 glass-panel"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <IconRenderer name={rel.icon} size={18} />
                </div>
                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                  {rel.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {rel.shortDesc}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
