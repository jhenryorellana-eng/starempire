'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import type { Company, Lesson, CompanyProgress } from '@/types';

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CompanyProgress | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [similarCompanies, setSimilarCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fromLessonId = searchParams.get('fromLesson');

  useEffect(() => {
    if (!token || !id) return;

    const fetchCompanyData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        const [companyRes, lessonsRes] = await Promise.all([
          fetch(`/api/companies/${id}`, { headers }),
          fetch(`/api/companies/${id}/lessons`, { headers }),
        ]);

        if (companyRes.ok) {
          const data = await companyRes.json();
          setCompany(data.company);
          setProgress(data.progress || null);
          setViewedIds(new Set(data.viewedLessonIds || []));
          setSimilarCompanies(data.similarCompanies || []);
        }

        if (lessonsRes.ok) {
          const data = await lessonsRes.json();
          setLessons(data.lessons || []);
        }
      } catch (err) {
        console.error('Error fetching company:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [token, id]);

  if (isLoading || !company) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextLesson = lessons.find((l) => !viewedIds.has(l.id));

  return (
    <div className="min-h-screen bg-background-dark pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-background-dark to-transparent">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full glass-icon flex items-center justify-center">
          <span className="material-icons-round text-white">arrow_back</span>
        </button>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full glass-icon flex items-center justify-center">
            <span className="material-icons-round text-white">share</span>
          </button>
          <button className="w-10 h-10 rounded-full glass-icon flex items-center justify-center">
            <span className="material-icons-round text-white">favorite_border</span>
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[420px] overflow-hidden">
        {company.coverUrl ? (
          <img alt={company.title} className="w-full h-full object-cover" src={company.coverUrl} />
        ) : (
          <div className="w-full h-full bg-surface-dark flex items-center justify-center">
            <span className="material-icons-round text-8xl text-gray-600">domain</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/40 via-transparent to-background-dark" />

        {/* Company info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-extrabold text-white mb-2 text-shadow-lg">{company.title}</h1>
          <p className="text-base text-gray-300 mb-1 text-shadow">{company.founder}</p>

          {/* Company details */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {company.industry && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{company.industry}</span>
            )}
            {company.foundedYear && (
              <span className="text-xs text-gray-400">Fundada en {company.foundedYear}</span>
            )}
            {company.headquarters && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="material-icons-round text-xs">location_on</span>
                {company.headquarters}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="material-icons-round text-sm text-orange-400">rocket_launch</span>
              <span className="text-sm text-white font-semibold">{company.totalGameChangers}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons-round text-sm text-yellow-300">lightbulb</span>
              <span className="text-sm text-gray-300">{company.totalInspired}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons-round text-sm text-gray-400">schedule</span>
              <span className="text-sm text-gray-300">
                {Math.ceil((company.totalDuration || company.totalLessons * 45) / 60)} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="sticky top-0 z-30 px-5 py-3 glass-panel">
        <button
          onClick={() => {
            if (nextLesson) router.push(`/?lessonId=${nextLesson.id}`);
            else if (lessons.length > 0) router.push(`/?lessonId=${lessons[0].id}`);
          }}
          className="w-full btn-gradient py-4 rounded-xl flex items-center justify-center gap-3"
        >
          <span className="material-icons-round">play_arrow</span>
          <span className="font-bold">
            {progress && progress.progressPercent > 0
              ? `CONTINUAR`
              : 'EMPEZAR DESDE LECCIÓN 1'}
          </span>
          {progress && (
            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {progress.progressPercent}%
            </span>
          )}
        </button>
      </div>

      {/* Description */}
      {company.description && (
        <div className="px-5 py-4">
          <p className="text-sm text-gray-300 leading-relaxed">{company.description}</p>
        </div>
      )}

      {/* Lessons Grid */}
      <div className="px-5 py-4">
        <h2 className="text-lg font-bold text-white mb-4">Lecciones</h2>

        <div className="grid grid-cols-4 gap-3">
          {lessons.map((lesson, index) => {
            const isViewed = viewedIds.has(lesson.id);
            const isCurrent = fromLessonId ? lesson.id === fromLessonId : index === 0;

            return (
              <Link
                key={lesson.id}
                href={`/?lessonId=${lesson.id}`}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                  isCurrent
                    ? 'border-2 border-primary shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)] bg-surface-dark'
                    : isViewed
                    ? 'border border-white/5 bg-surface-dark/50'
                    : 'border border-white/5 bg-background-dark/50'
                }`}
              >
                {isViewed ? (
                  <span className="material-icons-round text-green-400 text-xl">check_circle</span>
                ) : (
                  <span className={`font-extrabold text-lg ${isCurrent ? 'text-white' : 'text-gray-500 font-bold'}`}>
                    {String(lesson.lessonNumber).padStart(2, '0')}
                  </span>
                )}
                {isCurrent && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Similar Companies */}
      {similarCompanies.length > 0 && (
        <div className="px-5 py-4">
          <h2 className="text-lg font-bold text-white mb-4">Empresas Similares</h2>
          <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-5 px-5 snap-x">
            {similarCompanies.map((sc) => (
              <Link
                key={sc.id}
                href={`/explorar/empresa/${sc.id}`}
                className="flex-none w-[120px] snap-center group"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-dark mb-2 border border-white/5 transition-transform group-hover:-translate-y-1">
                  {sc.coverUrl ? (
                    <img alt={sc.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" src={sc.coverUrl} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-icons-round text-3xl text-gray-600">domain</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-white line-clamp-2">{sc.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{sc.founder}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
