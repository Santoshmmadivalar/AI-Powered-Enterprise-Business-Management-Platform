'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Compass, Eye, Shield, Users, Award, Briefcase } from 'lucide-react';
import { LinkedinIcon, TwitterIcon, GithubIcon } from '../../components/ui/BrandIcons';
import { getTeam } from '../../services/api';
import { TeamMember } from '../../types';
import { fallbackTeam } from '../../constants/fallbackData';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await getTeam();
        if (res.success && res.data.length > 0) {
          setTeam(res.data);
        } else {
          setTeam(fallbackTeam);
        }
      } catch (error) {
        console.warn('Failed to load team from API. Falling back to default team.', error);
        setTeam(fallbackTeam);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const coreValues = [
    {
      icon: <Shield className="text-primary" size={20} />,
      title: 'Obsessive Integrity',
      desc: 'We operate with absolute transparency in code quality, system capabilities, pricing models, and sprint progress.'
    },
    {
      icon: <Users className="text-primary" size={20} />,
      title: 'Customer-First Sprints',
      desc: 'Our delivery schedules, team communications, and cloud integrations center around client roadmaps and deadlines.'
    },
    {
      icon: <Award className="text-primary" size={20} />,
      title: 'Zero-Downtime Quality',
      desc: 'We enforce static compilation checks, unit validation suites, and automated test deployments for zero-defect setups.'
    }
  ];

  const timeline = [
    { year: '2016', title: 'Platform Launch', desc: 'Outpro.India was founded in Kolkata, beginning as a custom React web design and development team.' },
    { year: '2019', title: 'Enterprise Expansion', desc: 'Scaled operations to provide backend Node/Express microservices and complex B2B commerce software.' },
    { year: '2022', title: 'Cloud & Infrastructure Services', desc: 'Added dedicated Cloud Operations and automated IaC setup solutions to ensure scalable high-speed sites.' },
    { year: '2025', title: 'AI & Enterprise Operations', desc: 'Partnering globally with companies to deliver predictive telemetry AI engines, ML operations, and headless networks.' }
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <Breadcrumbs />

      {/* Hero Banner */}
      <section className="text-center max-w-3xl mx-auto space-y-6 mb-20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          <span>Our Story</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Architecting High-Speed Enterprise Futures
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          At Outpro.India, we translate commercial challenges into clean, high-performance, and secure software applications. Since our launch, we have stayed committed to bypassing generic templates in favor of modular custom software, high-end layouts, and resilient setups.
        </p>
      </section>

      {/* Vision & Mission */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="p-8 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Compass size={20} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Our Mission</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To provide enterprise organizations with highly aesthetic, secure, and performant digital assets that enhance client trust and drive business scalability.
          </p>
        </div>
        <div className="p-8 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Eye size={20} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Our Vision</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To remain the premier full-stack development and design partner in India, known for microservices engineering and modern user experience.
          </p>
        </div>
        <div className="p-8 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Target size={20} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Our Values</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Performance, aesthetics, and user trust are the pillars of every code repository, design system canvas, and deployment manifest we launch.
          </p>
        </div>
      </section>

      {/* Core Values Detail */}
      <section className="py-16 border-y border-border/40 bg-secondary/10 rounded-3xl mb-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Our Guiding Pillars</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">The Outpro Delivery Philosophy</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value, idx) => (
              <div key={idx} className="space-y-3 text-center md:text-left">
                <div className="mx-auto md:mx-0 p-3 h-10 w-10 rounded-lg bg-card border border-border/40 flex items-center justify-center shadow-md">
                  {value.icon}
                </div>
                <h4 className="font-bold text-base text-foreground">{value.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team Grid */}
      <section className="mb-24 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Leadership</h2>
          <h3 className="text-3xl font-extrabold text-foreground">Executive Board Members</h3>
          <p className="text-sm text-muted-foreground">
            Meet the engineers, architects, and product strategists steering our tech teams.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, idx) => (
                  <div key={idx} className="animate-pulse bg-secondary/50 rounded-2xl h-80 border border-border/20" />
                ))
            : team.map((member) => (
                <div
                  key={member._id}
                  className="group rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 glass-panel"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                        {member.name}
                      </h4>
                      <p className="text-xs text-primary font-medium">{member.role}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
                    
                    <div className="flex space-x-3 pt-2 border-t border-border/40">
                      {member.socials.linkedin && (
                        <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                          <LinkedinIcon size={14} />
                        </a>
                      )}
                      {member.socials.twitter && (
                        <a href={member.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                          <TwitterIcon size={14} />
                        </a>
                      )}
                      {member.socials.github && (
                        <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                          <GithubIcon size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="mb-24 space-y-16">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Our History</h2>
          <h3 className="text-3xl font-extrabold text-foreground">Timeline of Accomplishments</h3>
        </div>
        
        <div className="relative border-l border-border/60 max-w-3xl mx-auto pl-6 sm:pl-10 space-y-12">
          {timeline.map((t, idx) => (
            <div key={idx} className="relative space-y-2">
              <span className="absolute -left-[31px] sm:-left-[47px] top-1.5 h-4 w-4 rounded-full bg-primary border-4 border-background flex items-center justify-center shrink-0" />
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                {t.year}
              </span>
              <h4 className="font-bold text-lg text-foreground">{t.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
