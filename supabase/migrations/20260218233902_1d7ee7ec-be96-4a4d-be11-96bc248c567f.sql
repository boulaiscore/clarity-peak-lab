
-- Table: active_books — tracks books the user is currently reading (max 2)
CREATE TABLE public.active_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  source TEXT NOT NULL DEFAULT 'custom', -- 'looma_list' or 'custom'
  item_id TEXT, -- references content library item if from LOOMA
  cover_url TEXT,
  demand TEXT DEFAULT 'MEDIUM', -- LOW/MEDIUM/HIGH/VERY_HIGH
  total_minutes_read INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'reading', -- 'reading', 'completed', 'abandoned'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_books ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own active books"
ON public.active_books FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active books"
ON public.active_books FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active books"
ON public.active_books FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active books"
ON public.active_books FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_active_books_updated_at
BEFORE UPDATE ON public.active_books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
