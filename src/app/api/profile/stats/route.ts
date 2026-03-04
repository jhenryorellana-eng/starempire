import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    const [companiesRes, lessonsRes, allLessonsRes, completedViewsRes] = await Promise.all([
      supabase
        .from('company_progress')
        .select('id', { count: 'exact' })
        .eq('student_id', auth.sub),
      supabase
        .from('lesson_views')
        .select('id', { count: 'exact' })
        .eq('student_id', auth.sub)
        .eq('completed', true),
      // Total de lessons por tipo de categoría (solo empresas publicadas)
      supabase
        .from('lessons')
        .select('category_type, companies!inner(is_published)')
        .eq('companies.is_published', true),
      // Lessons completadas por el usuario
      supabase
        .from('lesson_views')
        .select('lesson_id, lessons!inner(category_type)')
        .eq('student_id', auth.sub)
        .eq('completed', true),
    ]);

    // Contar total de lessons por tipo de categoría
    const totalByType = new Map<string, number>();
    (allLessonsRes.data || []).forEach((lesson: Record<string, unknown>) => {
      const type = lesson.category_type as string;
      if (type) {
        totalByType.set(type, (totalByType.get(type) || 0) + 1);
      }
    });

    // Contar completadas por tipo de categoría
    const completedByType = new Map<string, number>();
    (completedViewsRes.data || []).forEach((view: Record<string, unknown>) => {
      const lessons = view.lessons as Record<string, unknown> | null;
      const type = lessons?.category_type as string;
      if (type) {
        completedByType.set(type, (completedByType.get(type) || 0) + 1);
      }
    });

    // Construir categories con porcentaje dinámico
    const categoryTypes = new Set([...totalByType.keys(), ...completedByType.keys()]);
    const categories = Array.from(categoryTypes).map((code) => {
      const total = totalByType.get(code) || 0;
      const completed = completedByType.get(code) || 0;
      const score = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        categoryCode: code,
        score,
        lessonsConsumed: completed,
      };
    });

    return NextResponse.json({
      totalCompaniesExplored: companiesRes.count || 0,
      totalLessonsDiscovered: lessonsRes.count || 0,
      categories,
    });
  } catch (error) {
    console.error('Profile stats error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
