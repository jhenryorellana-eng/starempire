'use client';

import { useRouter } from 'next/navigation';
import type { CategoryType } from '@/types';

const CATEGORY_GRID = [
  { code: 'tecnologia' as CategoryType, name: 'Tecnología', icon: 'memory', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { code: 'liderazgo' as CategoryType, name: 'Liderazgo', icon: 'groups', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { code: 'marketing' as CategoryType, name: 'Marketing', icon: 'campaign', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { code: 'finanzas' as CategoryType, name: 'Finanzas', icon: 'trending_up', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { code: 'innovacion' as CategoryType, name: 'Innovación', icon: 'lightbulb', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { code: 'impacto' as CategoryType, name: 'Impacto', icon: 'public', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { code: 'resiliencia' as CategoryType, name: 'Resiliencia', icon: 'shield', color: 'text-red-400', bg: 'bg-red-400/10' },
];

export function CategoryChips() {
  const router = useRouter();

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4 px-1">
        Por Categoría
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_GRID.map((cat) => (
          <button
            key={cat.code}
            onClick={() => router.push(`/explorar/categoria/${cat.code}`)}
            className="group flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 active:scale-[0.98] border-white/5 bg-gradient-to-br from-white/5 to-white/0 hover:from-primary/20 hover:to-primary/5"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cat.bg}`}>
              <span className={`material-icons-round text-xl ${cat.color}`}>
                {cat.icon}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">{cat.name}</p>
            </div>
            <span className="material-icons-round text-sm text-white/20 group-hover:translate-x-1 transition-transform duration-300">
              arrow_forward
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
