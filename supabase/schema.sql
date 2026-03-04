-- =====================================================
-- STAREMPIRE - SUPABASE SCHEMA
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STUDENTS TABLE (sync from CEO Junior)
-- =====================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    date_of_birth DATE,
    code VARCHAR(20) NOT NULL,
    family_id VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_external_id ON students(external_id);
CREATE INDEX idx_students_family_id ON students(family_id);

-- =====================================================
-- COMPANIES & CONTENT
-- =====================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    founder VARCHAR(255) NOT NULL,
    founder_verified BOOLEAN DEFAULT FALSE,
    description TEXT,
    cover_url TEXT,
    founded_year INTEGER,
    industry VARCHAR(100),
    headquarters VARCHAR(255),
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_lessons INTEGER DEFAULT 0,
    total_inspired INTEGER DEFAULT 0,
    total_game_changers INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_published ON companies(is_published);
CREATE INDEX idx_companies_tags ON companies USING GIN (tags);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    lesson_number INTEGER NOT NULL,
    key_lesson TEXT NOT NULL,
    video_url TEXT NOT NULL,
    video_thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 45,
    audio_track_name TEXT,
    category_type VARCHAR(50) NOT NULL,
    inspired_count INTEGER DEFAULT 0,
    game_changer_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_company ON lessons(company_id);
CREATE INDEX idx_lessons_category ON lessons(category_type);
CREATE INDEX idx_lessons_trending ON lessons(game_changer_count DESC, inspired_count DESC);

-- =====================================================
-- CATEGORIES (7 Types)
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    order_index INTEGER NOT NULL
);

INSERT INTO categories (code, name, description, icon, color, order_index) VALUES
('tecnologia', 'Tecnología', 'Innovación tecnológica y disrupción digital', 'memory', '#60a5fa', 1),
('liderazgo', 'Liderazgo', 'Visión, gestión de equipos y cultura empresarial', 'groups', '#a78bfa', 2),
('marketing', 'Marketing', 'Branding, growth hacking y estrategias de mercado', 'campaign', '#f472b6', 3),
('finanzas', 'Finanzas', 'Modelos de negocio, inversión y escalabilidad', 'trending_up', '#34d399', 4),
('innovacion', 'Innovación', 'Creatividad, pivotes y pensamiento disruptivo', 'lightbulb', '#fbbf24', 5),
('impacto', 'Impacto', 'Responsabilidad social y contribución al mundo', 'public', '#fb923c', 6),
('resiliencia', 'Resiliencia', 'Obstáculos superados, fracasos y reinvención', 'shield', '#f87171', 7);

-- =====================================================
-- STUDENT INTERACTIONS
-- =====================================================
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- inspired, game_changer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id, type)
);

CREATE INDEX idx_reactions_student ON reactions(student_id);
CREATE INDEX idx_reactions_lesson ON reactions(lesson_id);

CREATE TABLE bookmarks (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, lesson_id)
);

CREATE INDEX idx_bookmarks_student ON bookmarks(student_id);

CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    share_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shares_lesson ON shares(lesson_id);

-- =====================================================
-- COMPANY PROGRESS
-- =====================================================
CREATE TABLE company_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    lessons_viewed INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    progress_percent INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'studying',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, company_id)
);

CREATE INDEX idx_company_progress_student ON company_progress(student_id);
CREATE INDEX idx_company_progress_status ON company_progress(status);

CREATE TABLE lesson_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    watch_time_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_position_seconds INTEGER DEFAULT 0,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

CREATE INDEX idx_lesson_views_student ON lesson_views(student_id);
CREATE INDEX idx_lesson_views_lesson ON lesson_views(lesson_id);

-- =====================================================
-- PLAYLISTS
-- =====================================================
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_color VARCHAR(20) DEFAULT '#10B981',
    is_public BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_student ON playlists(student_id);

CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playlist_id, lesson_id)
);

CREATE INDEX idx_playlist_items_playlist ON playlist_items(playlist_id);

-- =====================================================
-- COLLECTIONS (Curated by admins)
-- =====================================================
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cover_url TEXT,
    gradient_from VARCHAR(20) DEFAULT '#10B981',
    gradient_to VARCHAR(20) DEFAULT '#065F46',
    order_index INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_companies (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    PRIMARY KEY (collection_id, company_id)
);

-- =====================================================
-- REFLECTIONS (Apuntes - Personal Notes)
-- =====================================================
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_student ON reflections(student_id);

-- =====================================================
-- SEARCH HISTORY
-- =====================================================
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_history_student ON search_history(student_id);
CREATE INDEX idx_search_history_date ON search_history(searched_at DESC);

-- =====================================================
-- STUDENT CATEGORY PROFILE
-- =====================================================
CREATE TABLE student_categories (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    category_code VARCHAR(50) REFERENCES categories(code),
    score INTEGER DEFAULT 0,
    lessons_consumed INTEGER DEFAULT 0,
    PRIMARY KEY (student_id, category_code)
);

CREATE INDEX idx_student_categories_student ON student_categories(student_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update lesson reaction counts
CREATE OR REPLACE FUNCTION update_lesson_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'inspired' THEN
            UPDATE lessons SET inspired_count = inspired_count + 1 WHERE id = NEW.lesson_id;
        ELSIF NEW.type = 'game_changer' THEN
            UPDATE lessons SET game_changer_count = game_changer_count + 1 WHERE id = NEW.lesson_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'inspired' THEN
            UPDATE lessons SET inspired_count = inspired_count - 1 WHERE id = OLD.lesson_id;
        ELSIF OLD.type = 'game_changer' THEN
            UPDATE lessons SET game_changer_count = game_changer_count - 1 WHERE id = OLD.lesson_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reactions_count_trigger
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_reaction_counts();

-- Update lesson bookmark counts
CREATE OR REPLACE FUNCTION update_lesson_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lessons SET save_count = save_count + 1 WHERE id = NEW.lesson_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lessons SET save_count = save_count - 1 WHERE id = OLD.lesson_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookmarks_count_trigger
    AFTER INSERT OR DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_bookmark_count();

-- Update company progress when lesson is viewed
CREATE OR REPLACE FUNCTION update_company_progress_on_view()
RETURNS TRIGGER AS $$
DECLARE
    company_id_var UUID;
    total_lessons_count INTEGER;
    completed_lessons INTEGER;
BEGIN
    SELECT l.company_id INTO company_id_var FROM lessons l WHERE l.id = NEW.lesson_id;
    SELECT COUNT(*) INTO total_lessons_count FROM lessons WHERE company_id = company_id_var;
    SELECT COUNT(*) INTO completed_lessons
    FROM lesson_views lv
    JOIN lessons l ON lv.lesson_id = l.id
    WHERE lv.student_id = NEW.student_id
    AND l.company_id = company_id_var
    AND lv.completed = TRUE;

    INSERT INTO company_progress (student_id, company_id, lessons_completed, progress_percent, last_viewed_at)
    VALUES (
        NEW.student_id,
        company_id_var,
        completed_lessons,
        CASE WHEN total_lessons_count > 0 THEN (completed_lessons * 100 / total_lessons_count) ELSE 0 END,
        NOW()
    )
    ON CONFLICT (student_id, company_id)
    DO UPDATE SET
        lessons_completed = completed_lessons,
        progress_percent = CASE WHEN total_lessons_count > 0 THEN (completed_lessons * 100 / total_lessons_count) ELSE 0 END,
        last_viewed_at = NOW(),
        completed_at = CASE WHEN completed_lessons >= total_lessons_count THEN NOW() ELSE company_progress.completed_at END,
        status = CASE WHEN completed_lessons >= total_lessons_count THEN 'completed' ELSE 'studying' END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_views_update_progress
    AFTER INSERT OR UPDATE ON lesson_views
    FOR EACH ROW
    EXECUTE FUNCTION update_company_progress_on_view();

-- Update student category scores
CREATE OR REPLACE FUNCTION update_student_category_score()
RETURNS TRIGGER AS $$
DECLARE
    category_type_var VARCHAR(50);
BEGIN
    -- Solo procesar si es INSERT con completed=true, o UPDATE donde completed cambió a true
    IF TG_OP = 'UPDATE' AND OLD.completed = TRUE THEN
        RETURN NEW; -- Ya se contó anteriormente
    END IF;

    SELECT category_type INTO category_type_var FROM lessons WHERE id = NEW.lesson_id;

    INSERT INTO student_categories (student_id, category_code, lessons_consumed, score)
    VALUES (NEW.student_id, category_type_var, 1, 10)
    ON CONFLICT (student_id, category_code)
    DO UPDATE SET
        lessons_consumed = student_categories.lessons_consumed + 1,
        score = LEAST(100, student_categories.score + 5);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_views_update_category
    AFTER INSERT OR UPDATE ON lesson_views
    FOR EACH ROW
    WHEN (NEW.completed = TRUE)
    EXECUTE FUNCTION update_student_category_score();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reflections_updated_at
    BEFORE UPDATE ON reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update company total_lessons when lessons are added/removed
CREATE OR REPLACE FUNCTION update_company_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE companies SET total_lessons = (
            SELECT COUNT(*) FROM lessons WHERE company_id = NEW.company_id
        ) WHERE id = NEW.company_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE companies SET total_lessons = (
            SELECT COUNT(*) FROM lessons WHERE company_id = OLD.company_id
        ) WHERE id = OLD.company_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lessons_count_trigger
    AFTER INSERT OR DELETE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_company_lessons_count();

-- Update company aggregate stats when reactions/bookmarks change
CREATE OR REPLACE FUNCTION update_company_reaction_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT company_id INTO v_company_id FROM lessons WHERE id = NEW.lesson_id;
    ELSE
        SELECT company_id INTO v_company_id FROM lessons WHERE id = OLD.lesson_id;
    END IF;

    UPDATE companies SET
        total_inspired = COALESCE((SELECT SUM(inspired_count) FROM lessons WHERE company_id = v_company_id), 0),
        total_game_changers = COALESCE((SELECT SUM(game_changer_count) FROM lessons WHERE company_id = v_company_id), 0),
        total_saves = COALESCE((SELECT SUM(save_count) FROM lessons WHERE company_id = v_company_id), 0)
    WHERE id = v_company_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_reaction_aggregates_trigger
    AFTER INSERT OR DELETE ON reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_company_reaction_aggregates();

CREATE TRIGGER company_bookmark_aggregates_trigger
    AFTER INSERT OR DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_company_reaction_aggregates();

-- =====================================================
-- NOTIFICATIONS (broadcast from admin)
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL DEFAULT 'new_lesson',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE notification_reads (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, notification_id)
);

CREATE INDEX idx_notification_reads_student ON notification_reads(student_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API routes using service key)
CREATE POLICY "Service role full access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON bookmarks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON company_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON lesson_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON playlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON playlist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reflections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON search_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON student_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON collection_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON shares FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON notification_reads FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKET & POLICIES
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('starempire', 'starempire', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on starempire" ON storage.objects
  FOR SELECT USING (bucket_id = 'starempire');

CREATE POLICY "Allow uploads to starempire" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'starempire');

CREATE POLICY "Allow updates in starempire" ON storage.objects
  FOR UPDATE USING (bucket_id = 'starempire');

CREATE POLICY "Allow deletes in starempire" ON storage.objects
  FOR DELETE USING (bucket_id = 'starempire');
