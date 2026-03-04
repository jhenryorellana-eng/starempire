import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    // Get company
    const { data: company, error } = await supabase
      .from('companies')
      .select('*, founded_year, industry, headquarters')
      .eq('id', params.id)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Calcular stats dinámicamente desde la tabla lessons
    const { data: companyLessons } = await supabase
      .from('lessons')
      .select('inspired_count, game_changer_count, save_count, duration_seconds')
      .eq('company_id', params.id);

    const lessonCount = (companyLessons || []).length;
    const totalInspired = (companyLessons || []).reduce((sum: number, i: any) => sum + (i.inspired_count || 0), 0);
    const totalGameChangers = (companyLessons || []).reduce((sum: number, i: any) => sum + (i.game_changer_count || 0), 0);
    const totalSaves = (companyLessons || []).reduce((sum: number, i: any) => sum + (i.save_count || 0), 0);
    const totalDuration = (companyLessons || []).reduce((sum: number, i: any) => sum + (i.duration_seconds || 0), 0);

    // Get user progress for this company
    const { data: progress } = await supabase
      .from('company_progress')
      .select('*')
      .eq('student_id', auth.sub)
      .eq('company_id', params.id)
      .single();

    // Get viewed lesson IDs (solo completados al 50%+)
    const { data: views } = await supabase
      .from('lesson_views')
      .select('lesson_id')
      .eq('student_id', auth.sub)
      .eq('completed', true);

    const viewedLessonIds = (views || []).map((v: { lesson_id: string }) => v.lesson_id);

    // Get similar companies (same tags or random published)
    const { data: similarCompanies } = await supabase
      .from('companies')
      .select('*')
      .eq('is_published', true)
      .neq('id', params.id)
      .limit(5);

    return NextResponse.json({
      company: {
        id: company.id,
        title: company.title,
        slug: company.slug,
        founder: company.founder,
        founderVerified: company.founder_verified,
        description: company.description,
        coverUrl: company.cover_url,
        averageRating: Number(company.average_rating),
        totalLessons: lessonCount,
        totalInspired,
        totalGameChangers,
        totalSaves,
        totalDuration,
        tags: company.tags || [],
        isPublished: company.is_published,
        foundedYear: company.founded_year,
        industry: company.industry,
        headquarters: company.headquarters,
      },
      progress: progress
        ? {
            id: progress.id,
            companyId: progress.company_id,
            lessonsCompleted: progress.lessons_completed,
            progressPercent: progress.progress_percent,
            status: progress.status,
            lastViewedAt: progress.last_viewed_at,
          }
        : null,
      viewedLessonIds,
      similarCompanies: await (async () => {
        const simIds = (similarCompanies || []).map((b: any) => b.id);
        const { data: simLessons } = simIds.length > 0
          ? await supabase.from('lessons').select('company_id').in('company_id', simIds)
          : { data: [] };
        const simCountMap = new Map<string, number>();
        (simLessons || []).forEach((r: { company_id: string }) => {
          simCountMap.set(r.company_id, (simCountMap.get(r.company_id) || 0) + 1);
        });
        return (similarCompanies || []).map((b: Record<string, unknown>) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          founder: b.founder,
          coverUrl: b.cover_url,
          totalLessons: simCountMap.get(b.id as string) || 0,
          averageRating: Number(b.average_rating),
        }));
      })(),
    });
  } catch (error) {
    console.error('Company detail error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
