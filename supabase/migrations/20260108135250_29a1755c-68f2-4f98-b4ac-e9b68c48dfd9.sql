-- Tabella per tracciare gli acquisti dei report PDF
CREATE TABLE public.report_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_payment_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 499,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'completed',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: utenti vedono solo i propri acquisti
ALTER TABLE public.report_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report purchases" 
  ON public.report_purchases FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report purchases" 
  ON public.report_purchases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);