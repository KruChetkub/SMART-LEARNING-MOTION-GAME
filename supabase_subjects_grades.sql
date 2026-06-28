-- 1. Create public.grades table
CREATE TABLE IF NOT EXISTS public.grades (
    id VARCHAR(20) PRIMARY KEY,
    label VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Check and create select policy for grades
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'grades' AND policyname = 'Allow public select on grades'
    ) THEN
        CREATE POLICY "Allow public select on grades" ON public.grades FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'grades' AND policyname = 'Allow admin manage grades'
    ) THEN
        CREATE POLICY "Allow admin manage grades" ON public.grades FOR ALL USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Populate default grades
INSERT INTO public.grades (id, label, name)
VALUES 
    ('P1', 'ป.1', 'ประถมศึกษาปีที่ 1'),
    ('P2', 'ป.2', 'ประถมศึกษาปีที่ 2'),
    ('P3', 'ป.3', 'ประถมศึกษาปีที่ 3'),
    ('P4', 'ป.4', 'ประถมศึกษาปีที่ 4'),
    ('P5', 'ป.5', 'ประถมศึกษาปีที่ 5'),
    ('P6', 'ป.6', 'ประถมศึกษาปีที่ 6'),
    ('M1', 'ม.1', 'มัธยมศึกษาปีที่ 1'),
    ('M2', 'ม.2', 'มัธยมศึกษาปีที่ 2'),
    ('M3', 'ม.3', 'มัธยมศึกษาปีที่ 3'),
    ('M4', 'ม.4', 'มัธยมศึกษาปีที่ 4'),
    ('M5', 'ม.5', 'มัธยมศึกษาปีที่ 5'),
    ('M6', 'ม.6', 'มัธยมศึกษาปีที่ 6')
ON CONFLICT (id) DO UPDATE 
SET label = EXCLUDED.label, name = EXCLUDED.name;


-- 2. Create public.subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    icon VARCHAR(20) DEFAULT '📚' NOT NULL,
    color VARCHAR(100) DEFAULT 'from-blue-500 to-cyan-500' NOT NULL,
    categories JSONB DEFAULT '[]'::jsonb NOT NULL,
    allowed_grades TEXT[] DEFAULT ARRAY['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']::text[] NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Check and create policies for subjects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subjects' AND policyname = 'Allow public select on subjects'
    ) THEN
        CREATE POLICY "Allow public select on subjects" ON public.subjects FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subjects' AND policyname = 'Allow admin manage subjects'
    ) THEN
        CREATE POLICY "Allow admin manage subjects" ON public.subjects FOR ALL USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Populate default subjects
INSERT INTO public.subjects (id, name, name_en, icon, color, categories, allowed_grades, is_active)
VALUES 
    ('Mathematics', 'คณิตศาสตร์', 'Mathematics', '🔢', 'from-blue-500 to-cyan-500', 
     '[{"id": "mixed", "label": "ผสมทุกเครื่องหมาย", "labelEn": "Mixed"}, {"id": "addition", "label": "การบวก (+)", "labelEn": "Addition"}, {"id": "subtraction", "label": "การลบ (-)", "labelEn": "Subtraction"}, {"id": "multiplication", "label": "การคูณ (×)", "labelEn": "Multiplication"}, {"id": "division", "label": "การหาร (÷)", "labelEn": "Division"}]'::jsonb, 
     ARRAY['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']::text[], true),
    ('Thai', 'ภาษาไทย', 'Thai Language', '🇹🇭', 'from-orange-500 to-amber-500', 
     '[{"id": "mixed", "label": "ผสมทุกหมวด", "labelEn": "Mixed"}, {"id": "vowels", "label": "สระ", "labelEn": "Vowels"}, {"id": "consonants", "label": "พยัญชนะ", "labelEn": "Consonants"}, {"id": "reading", "label": "คำอ่าน", "labelEn": "Reading"}, {"id": "vocabulary", "label": "คำศัพท์", "labelEn": "Vocabulary"}]'::jsonb, 
     ARRAY['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']::text[], true),
    ('English', 'ภาษาอังกฤษ', 'English', '🌍', 'from-pink-500 to-rose-500', 
     '[{"id": "mixed", "label": "ผสมทุกหมวด", "labelEn": "Mixed"}, {"id": "vocabulary", "label": "คำศัพท์", "labelEn": "Vocabulary"}, {"id": "grammar", "label": "ไวยากรณ์", "labelEn": "Grammar"}, {"id": "spelling", "label": "การสะกดคำ", "labelEn": "Spelling"}, {"id": "reading", "label": "การอ่าน", "labelEn": "Reading"}]'::jsonb, 
     ARRAY['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']::text[], true),
    ('Science', 'วิทยาศาสตร์', 'Science', '🔬', 'from-green-500 to-emerald-500', 
     '[{"id": "mixed", "label": "ผสมทุกหมวด", "labelEn": "Mixed"}]'::jsonb, 
     ARRAY['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']::text[], false),
    ('Social', 'สังคมศึกษา', 'Social Studies', '🏛️', 'from-purple-500 to-violet-500', 
     '[{"id": "mixed", "label": "ผสมทุกหมวด", "labelEn": "Mixed"}]'::jsonb, 
     ARRAY['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']::text[], false)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, name_en = EXCLUDED.name_en, icon = EXCLUDED.icon, color = EXCLUDED.color, categories = EXCLUDED.categories, allowed_grades = EXCLUDED.allowed_grades;
