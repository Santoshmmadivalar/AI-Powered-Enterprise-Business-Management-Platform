'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, ExternalLink, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { getProjectById, getPortfolio } from '../../../services/api';
import { Project } from '../../../types';
import { fallbackProjects } from '../../../constants/fallbackData';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { DetailSkeleton } from '../../../components/ui/LoadingSkeleton';

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const [detailRes, listRes] = await Promise.all([
          getProjectById(id),
          getPortfolio()
        ]);

        if (detailRes.success && detailRes.data) {
          setProject(detailRes.data);
        } else {
          const fallback = fallbackProjects.find((p) => p.slug === id || p._id === id);
          if (fallback) setProject(fallback);
          else router.push('/portfolio');
        }

        if (listRes.success) {
          setRelated(listRes.data.filter((p) => p.slug !== id && p._id !== id).slice(0, 2));
        } else {
          setRelated(fallbackProjects.filter((p) => p.slug !== id && p._id !== id).slice(0, 2));
        }
      } catch (error) {
        console.warn('API error fetching portfolio details. Loading cached fallback case study:', error);
        const fallback = fallbackProjects.find((p) => p.slug === id || p._id === id);
        if (fallback) {
          setProject(fallback);
          setRelated(fallbackProjects.filter((p) => p.slug !== id && p._id !== id).slice(0, 2));
        } else {
          router.push('/portfolio');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id, router]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!project) {
    return null;
  }

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <Breadcrumbs />
        <Link
          href="/portfolio"
          className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Portfolio
        </Link>
      </div>

      {/* Case Study Title Header */}
      <section className="space-y-4 mb-12">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          {project.category.name}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          {project.title}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-4xl leading-relaxed">
          {project.description}
        </p>
      </section>

      {/* Project Cover Image */}
      <section className="relative h-[300px] sm:h-[480px] rounded-3xl overflow-hidden border border-border/40 mb-16 shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.images[0]}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      </section>

      {/* Project details breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
        {/* Challenge, Solution, Outcomes */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">The Business Challenge</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {project.challenge}
            </p>
          </div>

          <div className="space-y-4 pt-8 border-t border-border/20">
            <h2 className="text-xl font-bold text-foreground">Solutions Delivered</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {project.solution}
            </p>
          </div>

          {/* Results/Gallery grid */}
          {project.images.length > 1 && (
            <div className="space-y-4 pt-8 border-t border-border/20">
              <h2 className="text-xl font-bold text-foreground font-sans">Additional Project Views</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {project.images.slice(1).map((img, idx) => (
                  <div key={idx} className="relative h-48 rounded-xl overflow-hidden border border-border/40 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${project.title} secondary`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar details */}
        <div className="space-y-8">
          {/* Metadata details */}
          <div className="p-6 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel text-sm">
            <h3 className="font-bold text-base text-foreground pb-2 border-b border-border/20">
              Project Insights
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client Name:</span>
                <span className="font-bold text-foreground">{project.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-bold text-foreground">{project.category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-bold text-emerald-500 flex items-center">
                  Active in Production
                </span>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="p-6 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel">
            <h3 className="font-bold text-base text-foreground pb-2 border-b border-border/20">
              Performance KPIs
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {project.kpis.map((kpi, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-lg bg-secondary/50">
                  <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                  <span className="text-base font-extrabold text-primary">{kpi.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack tags */}
          <div className="p-6 bg-card border border-border/40 rounded-2xl space-y-4 glass-panel">
            <h3 className="font-bold text-base text-foreground pb-2 border-b border-border/20">
              Technologies Used
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 rounded bg-secondary text-foreground/85 font-semibold">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Client testimonial */}
          {project.clientFeedback && (
            <div className="p-6 bg-secondary/20 border border-border/40 rounded-2xl space-y-4 glass-panel">
              <div className="flex space-x-1">
                {Array(project.clientFeedback.rating)
                  .fill(0)
                  .map((_, i) => (
                    <Star key={i} size={14} className="fill-primary text-primary" />
                  ))}
              </div>
              <p className="text-xs italic text-foreground leading-relaxed">
                "{project.clientFeedback.comment}"
              </p>
              <div className="pt-2 border-t border-border/20">
                <p className="text-xs font-bold text-foreground">{project.clientFeedback.reviewerName}</p>
                <p className="text-[10px] text-muted-foreground">{project.clientFeedback.reviewerRole}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Projects */}
      {related.length > 0 && (
        <section className="border-t border-border/20 pt-16 mb-12 space-y-8">
          <h3 className="text-xl font-bold text-foreground">Other Success Stories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {related.map((rel) => (
              <Link
                key={rel._id}
                href={`/portfolio/${rel.slug}`}
                className="group flex flex-col justify-between p-6 bg-card border border-border/40 rounded-2xl hover:border-primary transition-all duration-200 glass-panel"
              >
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-secondary px-2 py-0.5 rounded">
                    {rel.category.name}
                  </span>
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {rel.description}
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-primary group-hover:underline mt-6">
                  Explore Case Study
                  <ChevronRight size={14} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
