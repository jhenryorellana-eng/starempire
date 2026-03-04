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

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('company_id', params.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Lessons query error:', error);
      return NextResponse.json({ error: 'Error al cargar lecciones' }, { status: 500 });
    }

    const mappedLessons = (lessons || []).map((i: Record<string, unknown>) => ({
      id: i.id,
      companyId: i.company_id,
      title: i.title,
      lessonNumber: i.lesson_number,
      keyLesson: i.key_lesson,
      videoUrl: i.video_url,
      videoThumbnailUrl: i.video_thumbnail_url,
      durationSeconds: i.duration_seconds,
      categoryType: i.category_type,
      inspiredCount: i.inspired_count,
      gameChangerCount: i.game_changer_count,
      saveCount: i.save_count,
      viewCount: i.view_count,
      orderIndex: i.order_index,
    }));

    return NextResponse.json({ lessons: mappedLessons });
  } catch (error) {
    console.error('Company lessons error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
