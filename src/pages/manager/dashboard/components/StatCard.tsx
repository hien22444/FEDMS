import type { ReactNode } from 'react';
import { RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  change?: number;
  variant?: 'default' | 'success' | 'warning' | 'orange' | 'danger' | 'blue' | 'purple' | 'cyan' | 'pink';
}

const variantStyles = {
  default: {
    cardBg: 'bg-white',
    cardBorder: 'border-gray-100',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
  },
  // Pastel variants for stats row 1
  blue: {
    cardBg: 'bg-blue-50',
    cardBorder: 'border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  purple: {
    cardBg: 'bg-violet-50',
    cardBorder: 'border-violet-100',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  cyan: {
    cardBg: 'bg-cyan-50',
    cardBorder: 'border-cyan-100',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  pink: {
    cardBg: 'bg-pink-50',
    cardBorder: 'border-pink-100',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  // Action variants for stats row 2
  orange: {
    cardBg: 'bg-orange-50',
    cardBorder: 'border-orange-200',
    iconBg: 'bg-orange-500',
    iconColor: 'text-white',
  },
  success: {
    cardBg: 'bg-emerald-50',
    cardBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
  },
  warning: {
    cardBg: 'bg-amber-50',
    cardBorder: 'border-amber-200',
    iconBg: 'bg-amber-400',
    iconColor: 'text-white',
  },
  danger: {
    cardBg: 'bg-rose-50',
    cardBorder: 'border-rose-200',
    iconBg: 'bg-rose-500',
    iconColor: 'text-white',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  change,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`${styles.cardBg} border ${styles.cardBorder} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {change >= 0 ? <RiArrowUpLine size={14} /> : <RiArrowDownLine size={14} />}
              <span>{change >= 0 ? '+' : ''}{change}% from last month</span>
            </div>
          )}
        </div>
        <div className={`${styles.iconBg} ${styles.iconColor} p-3 rounded-xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
