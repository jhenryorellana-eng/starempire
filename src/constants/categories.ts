import type { Category } from '@/types';

export const CATEGORIES: Category[] = [
  {
    code: 'tecnologia',
    name: 'Tecnologia',
    description: 'Innovacion tecnologica y disrupcion digital',
    icon: 'memory',
    color: '#60a5fa',
  },
  {
    code: 'liderazgo',
    name: 'Liderazgo',
    description: 'Vision, gestion de equipos y cultura empresarial',
    icon: 'groups',
    color: '#a78bfa',
  },
  {
    code: 'marketing',
    name: 'Marketing',
    description: 'Branding, growth hacking y estrategias de mercado',
    icon: 'campaign',
    color: '#f472b6',
  },
  {
    code: 'finanzas',
    name: 'Finanzas',
    description: 'Modelos de negocio, inversion y escalabilidad',
    icon: 'trending_up',
    color: '#34d399',
  },
  {
    code: 'innovacion',
    name: 'Innovacion',
    description: 'Creatividad, pivotes y pensamiento disruptivo',
    icon: 'lightbulb',
    color: '#fbbf24',
  },
  {
    code: 'impacto',
    name: 'Impacto',
    description: 'Responsabilidad social y contribucion al mundo',
    icon: 'public',
    color: '#fb923c',
  },
  {
    code: 'resiliencia',
    name: 'Resiliencia',
    description: 'Obstaculos superados, fracasos y reinvencion',
    icon: 'shield',
    color: '#f87171',
  },
];

export const getCategoryByCode = (code: string) =>
  CATEGORIES.find((c) => c.code === code);
