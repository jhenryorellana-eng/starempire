import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'trending';
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const supabase = createServerClient();

    let query = supabase
      .from('companies')
      .select('*')
      .eq('is_published', true)
      .limit(limit);

    if (category) {
      // Filter companies that have lessons with this category type
      const { data: companyIds } = await supabase
        .from('lessons')
        .select('company_id')
        .eq('category_type', category);

      if (companyIds && companyIds.length > 0) {
        const uniqueIds = Array.from(new Set(companyIds.map((b: { company_id: string }) => b.company_id)));
        query = query.in('id', uniqueIds);
      }
    }

    if (sort === 'trending') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('average_rating', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: companies, error } = await query;

    if (error) {
      console.error('Companies query error:', error);
      return NextResponse.json({ error: 'Error al cargar empresas' }, { status: 500 });
    }

    // Calcular stats dinámicamente desde la tabla lessons
    const companyIds = (companies || []).map((b: any) => b.id);
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('company_id, inspired_count, game_changer_count, save_count')
      .in('company_id', companyIds);

    const companyStatsMap = new Map<string, { count: number; inspired: number; gameChangers: number; saves: number }>();
    (lessonsData || []).forEach((lesson: any) => {
      const stats = companyStatsMap.get(lesson.company_id) || { count: 0, inspired: 0, gameChangers: 0, saves: 0 };
      stats.count++;
      stats.inspired += lesson.inspired_count || 0;
      stats.gameChangers += lesson.game_changer_count || 0;
      stats.saves += lesson.save_count || 0;
      companyStatsMap.set(lesson.company_id, stats);
    });

    const mappedCompanies = (companies || []).map((b: Record<string, unknown>) => {
      const stats = companyStatsMap.get(b.id as string) || { count: 0, inspired: 0, gameChangers: 0, saves: 0 };
      return {
        id: b.id,
        title: b.title,
        slug: b.slug,
        founder: b.founder,
        founderVerified: b.founder_verified,
        description: b.description,
        coverUrl: b.cover_url,
        averageRating: Number(b.average_rating),
        totalLessons: stats.count,
        totalInspired: stats.inspired,
        totalGameChangers: stats.gameChangers,
        totalSaves: stats.saves,
        tags: b.tags || [],
        isPublished: b.is_published,
      };
    });

    // Ordenar por suma de game_changers + inspired (trending dinámico)
    if (sort === 'trending') {
      mappedCompanies.sort((a: { totalGameChangers: number; totalInspired: number }, b: { totalGameChangers: number; totalInspired: number }) =>
        (b.totalGameChangers + b.totalInspired) - (a.totalGameChangers + a.totalInspired)
      );
    }

    return NextResponse.json({ companies: mappedCompanies });
  } catch (error) {
    console.error('Companies error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
