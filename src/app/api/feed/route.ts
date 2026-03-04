import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest, unauthorizedResponse } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'normal';
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const startFromLesson = searchParams.get('startFromLesson');
  const excludeParam = searchParams.get('exclude');
  const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

  try {
    const supabase = createServerClient();

    // === MODO COMPANY ===
    if (mode === 'company' && startFromLesson) {
      const { data: targetLesson } = await supabase
        .from('lessons')
        .select('company_id, order_index')
        .eq('id', startFromLesson)
        .single();

      if (!targetLesson) {
        return NextResponse.json({ items: [], nextCursor: null });
      }

      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`*, companies!inner (id, title, founder, founder_verified, cover_url, total_lessons)`)
        .eq('company_id', targetLesson.company_id)
        .gte('order_index', targetLesson.order_index)
        .order('order_index', { ascending: true });

      if (error || !lessons) {
        return NextResponse.json({ items: [], nextCursor: null });
      }

      const enriched = await enrichItems(supabase, lessons, auth.sub);
      return NextResponse.json({ items: enriched, nextCursor: null, companyComplete: true });
    }

    // === MODO BOOKMARKS ===
    if (mode === 'bookmarks') {
      const { data: bookmarkRows } = await supabase
        .from('bookmarks')
        .select('lesson_id')
        .eq('student_id', auth.sub);

      const bookmarkedIds = (bookmarkRows || []).map((b: { lesson_id: string }) => b.lesson_id);
      if (bookmarkedIds.length === 0) {
        return NextResponse.json({ items: [], reset: false });
      }

      const availableIds = bookmarkedIds.filter((id: string) => !excludeIds.includes(id));

      if (availableIds.length === 0) {
        return NextResponse.json({ items: [], reset: true });
      }

      const selectedIds = shuffle(availableIds).slice(0, limit);

      const { data: lessons } = await supabase
        .from('lessons')
        .select(`*, companies!inner (id, title, founder, founder_verified, cover_url, total_lessons)`)
        .in('id', selectedIds);

      const shuffled = shuffle(lessons || []);
      const enriched = await enrichItems(supabase, shuffled, auth.sub);
      return NextResponse.json({ items: enriched, hasMore: true });
    }

    // === MODO NORMAL / CATEGORY ===
    // 1. Obtener IDs completados por el usuario
    const { data: completedRows } = await supabase
      .from('lesson_views')
      .select('lesson_id')
      .eq('student_id', auth.sub)
      .eq('completed', true);

    const completedIds = new Set((completedRows || []).map((v: { lesson_id: string }) => v.lesson_id));

    // 2. Obtener TODAS las lessons candidatas (publicadas)
    let candidateQuery = supabase
      .from('lessons')
      .select('id, companies!inner(is_published)')
      .eq('companies.is_published', true);

    if (category) {
      candidateQuery = candidateQuery.eq('category_type', category);
    }

    const { data: allLessons } = await candidateQuery;

    const allCandidateIds = (allLessons || []).map((i: { id: string }) => i.id);

    // 3. Separar en no-completados y completados, excluyendo los ya mostrados
    const notCompletedAvailable = allCandidateIds.filter(
      (id: string) => !completedIds.has(id) && !excludeIds.includes(id)
    );
    const completedAvailable = allCandidateIds.filter(
      (id: string) => completedIds.has(id) && !excludeIds.includes(id)
    );

    // 4. Priorizar no-completados, luego completados
    let selectedIds: string[] = [];
    const shuffledNotCompleted = shuffle(notCompletedAvailable);
    selectedIds.push(...shuffledNotCompleted.slice(0, limit));

    if (selectedIds.length < limit) {
      const remaining = limit - selectedIds.length;
      const shuffledCompleted = shuffle(completedAvailable);
      selectedIds.push(...shuffledCompleted.slice(0, remaining));
    }

    // 5. Si no hay nada disponible → reset
    if (selectedIds.length === 0) {
      return NextResponse.json({ items: [], reset: true, hasMore: true });
    }

    // 6. Fetch lessons completas
    const { data: lessons } = await supabase
      .from('lessons')
      .select(`*, companies!inner (id, title, founder, founder_verified, cover_url, total_lessons)`)
      .in('id', selectedIds);

    // 7. Mantener el orden shuffled (el .in() no garantiza orden)
    const idOrder = new Map(selectedIds.map((id, idx) => [id, idx]));
    const sortedLessons = (lessons || []).sort(
      (a: any, b: any) => (idOrder.get(a.id) || 0) - (idOrder.get(b.id) || 0)
    );

    const enriched = await enrichItems(supabase, sortedLessons, auth.sub);
    return NextResponse.json({ items: enriched, hasMore: true });

  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

async function enrichItems(supabase: any, lessons: any[], studentId: string) {
  if (!lessons || lessons.length === 0) return [];

  // Contar lessons reales por company
  const companyIds = [...new Set(lessons.map((i: any) => i.companies.id))];
  const { data: lessonCounts } = await supabase
    .from('lessons')
    .select('company_id')
    .in('company_id', companyIds);

  const companyLessonCountMap = new Map<string, number>();
  (lessonCounts || []).forEach((row: { company_id: string }) => {
    companyLessonCountMap.set(row.company_id, (companyLessonCountMap.get(row.company_id) || 0) + 1);
  });

  // User state
  const lessonIds = lessons.map((i: { id: string }) => i.id);

  const [reactionsResult, bookmarksResult, viewsResult] = await Promise.all([
    supabase
      .from('reactions')
      .select('lesson_id, type')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds),
    supabase
      .from('bookmarks')
      .select('lesson_id')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds),
    supabase
      .from('lesson_views')
      .select('lesson_id')
      .eq('student_id', studentId)
      .in('lesson_id', lessonIds),
  ]);

  const userReactions = new Map<string, Set<string>>();
  (reactionsResult.data || []).forEach((r: { lesson_id: string; type: string }) => {
    if (!userReactions.has(r.lesson_id)) userReactions.set(r.lesson_id, new Set());
    userReactions.get(r.lesson_id)!.add(r.type);
  });

  const userBookmarks = new Set(
    (bookmarksResult.data || []).map((b: { lesson_id: string }) => b.lesson_id)
  );
  const userViews = new Set(
    (viewsResult.data || []).map((v: { lesson_id: string }) => v.lesson_id)
  );

  return lessons.map((lesson: any) => ({
    id: lesson.id,
    companyId: lesson.companies.id,
    title: lesson.title,
    lessonNumber: lesson.lesson_number,
    keyLesson: lesson.key_lesson,
    videoUrl: lesson.video_url,
    videoThumbnailUrl: lesson.video_thumbnail_url,
    durationSeconds: lesson.duration_seconds,
    audioTrackName: lesson.audio_track_name,
    categoryType: lesson.category_type,
    inspiredCount: lesson.inspired_count,
    gameChangerCount: lesson.game_changer_count,
    saveCount: lesson.save_count,
    shareCount: lesson.share_count,
    viewCount: lesson.view_count,
    orderIndex: lesson.order_index,
    companyTitle: lesson.companies.title,
    companyFounder: lesson.companies.founder,
    companyFounderVerified: lesson.companies.founder_verified,
    companyCoverUrl: lesson.companies.cover_url,
    companyTotalLessons: companyLessonCountMap.get(lesson.companies.id) || 0,
    hasInspired: userReactions.get(lesson.id)?.has('inspired') || false,
    hasGameChanger: userReactions.get(lesson.id)?.has('game_changer') || false,
    hasBookmarked: userBookmarks.has(lesson.id),
    isViewed: userViews.has(lesson.id),
  }));
}
