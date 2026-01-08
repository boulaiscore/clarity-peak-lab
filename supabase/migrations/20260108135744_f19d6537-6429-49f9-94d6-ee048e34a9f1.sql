-- Aggiungi colonna per i report credits nel profilo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS report_credits INTEGER NOT NULL DEFAULT 0;

-- Tabella per tracciare acquisti di pacchetti credits
CREATE TABLE public.report_credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_payment_id TEXT,
  credits_amount INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'completed',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.report_credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit purchases" 
  ON public.report_credit_purchases FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit purchases" 
  ON public.report_credit_purchases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);