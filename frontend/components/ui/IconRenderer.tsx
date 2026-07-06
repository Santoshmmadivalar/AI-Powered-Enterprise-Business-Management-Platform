import React from 'react';
import { Code, Globe, Cloud, Shield, Database, BarChart, Server, Cpu } from 'lucide-react';
import { FramerIcon } from './BrandIcons';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Code,
  Globe,
  Framer: FramerIcon,
  Cloud,
  Shield,
  Database,
  BarChart,
  Server,
  Cpu,
};

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className, size = 24 }) => {
  const IconComponent = iconMap[name] || Code;
  return <IconComponent className={className} size={size} />;
};

export default IconRenderer;
