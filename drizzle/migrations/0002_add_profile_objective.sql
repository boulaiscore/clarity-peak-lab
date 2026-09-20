ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objective_label text,
  ADD COLUMN IF NOT EXISTS objective_date date;