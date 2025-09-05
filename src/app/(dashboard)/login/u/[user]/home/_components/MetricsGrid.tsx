'use client';

import { motion } from 'framer-motion';
import { Cpu, HardDrive, Users, Clock } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { metricCards } from './utils/mockData';
import { containerVariants } from './utils/animations';

// Icon mapping for string-based icon names
const iconMap = {
  Cpu,
  HardDrive,
  Users,
  Clock
};

export function MetricsGrid() {
  return (
    <motion.div 
      variants={containerVariants}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {metricCards.map((metric, index) => {
        const IconComponent = iconMap[metric.icon as keyof typeof iconMap];
        
        return (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            unit={metric.unit}
            change={metric.change}
            icon={IconComponent}
            trend={metric.trend}
            description={metric.description}
          />
        );
      })}
    </motion.div>
  );
} 