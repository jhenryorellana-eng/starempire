import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('company_progress')
      .select(`*, companies (*)`)
      .eq('student_id', auth.sub)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al cargar' }, { status: 500 });
    }

    const items = (data || []).map((p: any) => ({
      id: p.id,
      companyId: p.company_id,
      lessonsCompleted: p.lessons_completed,
      progressPercent: p.progress_percent,
      status: p.status,
      completedAt: p.completed_at,
      company: p.companies ? {
        id: p.companies.id,
        title: p.companies.title,
        founder: p.companies.founder,
        coverUrl: p.companies.cover_url,
        totalLessons: p.companies.total_lessons,
      } : null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Completed error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
