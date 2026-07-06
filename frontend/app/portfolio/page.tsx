'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Filter, ExternalLink } from 'lucide-react';
import { getPortfolio } from '../../services/api';
import { Project } from '../../types';
import { fallbackProjects } from '../../constants/fallbackData';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await getPortfolio();
        if (res.success && res.data.length > 0) {
          setProjects(res.data);
          setFiltered(res.data);
          extractCategories(res.data);
        } else {
          setProjects(fallbackProjects);
          setFiltered(fallbackProjects);
          extractCategories(fallbackProjects);
        }
      } catch (error) {
        console.warn('Failed to load portfolio from API. Loading fallback case studies.', error);
        setProjects(fallbackProjects);
        setFiltered(fallbackProjects);
        extractCategories(fallbackProjects);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  const extractCategories = (items: Project[]) => {
    const cats = new Set(items.map((item) => item.category.name));
    setCategories(['All', ...Array.from(cats)]);
  };

  const handleFilter = (cat: string) => {
    setSelectedCat(cat);
    if (cat === 'All') {
      setFiltered(projects);
    } else {
      setFiltered(projects.filter((p) => p.category.name === cat));
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <Breadcrumbs />

      {/* Page Header */}
      <section className="max-w-3xl space-y-6 mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          <Sparkles size={12} />
          <span>Case Studies Portfolio</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Selected Deliveries Driving Digital Performance
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          From full redesigns of digital banking structures to telemetry cloud pipelines for logistics fleets, explore how we deliver quality code.
        </p>
      </section>

      {/* Categories Filter Bar */}
      <section className="flex flex-wrap items-center gap-2 mb-12 pb-6 border-b border-border/20">
        <div className="flex items-center text-xs font-bold text-muted-foreground uppercase tracking-wider mr-4">
          <Filter size={14} className="mr-1.5 text-primary" />
          Filter Projects:
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              selectedCat === cat
                ? 'bg-primary border-primary text-primary-foreground shadow-md'
                : 'bg-card border-border/40 hover:bg-accent text-foreground/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Case Studies Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {loading
          ? Array(3)
              .fill(0)
              .map((_, idx) => <CardSkeleton key={idx} />)
          : (
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.div
                  key={project._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="group rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-300 hover:shadow-2xl glass-panel flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-56 overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.images[0]}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      />
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md">
                        {project.category.name}
                      </span>
                    </div>
                    <div className="p-8 space-y-4">
                      <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {project.title}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-8 pt-0 space-y-6">
                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
                      {project.kpis.map((kpi, idx) => (
                        <div key={idx} className="text-center">
                          <p className="text-base font-bold text-primary">{kpi.value}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{kpi.label}</p>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/portfolio/${project.slug}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-foreground bg-secondary hover:bg-accent border border-border/40 rounded-lg transition-colors"
                    >
                      View Case Study Details
                      <ExternalLink size={12} className="ml-1.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
      </section>
    </div>
  );
}
