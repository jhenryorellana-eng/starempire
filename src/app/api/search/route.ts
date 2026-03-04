import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ companies: [] });
    }

    const supabase = createServerClient();
    const searchTerm = `%${query.trim()}%`;

    // Search companies by title or founder
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_published', true)
      .or(`title.ilike.${searchTerm},founder.ilike.${searchTerm}`)
      .limit(20);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Error en búsqueda' }, { status: 500 });
    }

    const mappedCompanies = (companies || []).map((b: Record<string, unknown>) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      founder: b.founder,
      founderVerified: b.founder_verified,
      description: b.description,
      coverUrl: b.cover_url,
      averageRating: Number(b.average_rating),
      totalLessons: b.total_lessons,
      totalInspired: b.total_inspired,
      totalGameChangers: b.total_game_changers,
      totalSaves: b.total_saves,
      tags: b.tags || [],
      isPublished: b.is_published,
    }));

    return NextResponse.json({ companies: mappedCompanies });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
