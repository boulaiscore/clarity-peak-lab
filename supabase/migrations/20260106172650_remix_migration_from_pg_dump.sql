CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: exercise_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_category AS ENUM (
    'reasoning',
    'clarity',
    'decision',
    'fast',
    'slow',
    'bias',
    'logic_puzzle',
    'creative',
    'attention',
    'working_memory',
    'inhibition',
    'cognitive_control',
    'executive_control',
    'insight',
    'reflection',
    'philosophical',
    'visual',
    'spatial',
    'game',
    'visual_memory'
);


--
-- Name: exercise_difficulty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_difficulty AS ENUM (
    'easy',
    'medium',
    'hard'
);


--
-- Name: exercise_duration; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_duration AS ENUM (
    '30s',
    '2min',
    '5min',
    '3min',
    '7min',
    '90s',
    '1min'
);


--
-- Name: exercise_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_type AS ENUM (
    'multiple_choice',
    'detect_fallacy',
    'open_reflection',
    'logic_puzzle',
    'scenario_choice',
    'probability_estimation',
    'visual_drill',
    'visual_task'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name');
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: cognitive_exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cognitive_exercises (
    id text NOT NULL,
    category public.exercise_category NOT NULL,
    type public.exercise_type NOT NULL,
    difficulty public.exercise_difficulty NOT NULL,
    duration public.exercise_duration NOT NULL,
    title text NOT NULL,
    prompt text NOT NULL,
    options text[],
    correct_option_index integer,
    explanation text,
    metrics_affected text[] DEFAULT '{}'::text[] NOT NULL,
    weight numeric DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gym_area text,
    thinking_mode text
);


--
-- Name: detox_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detox_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    duration_minutes integer NOT NULL,
    xp_earned integer NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    week_start date DEFAULT (date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date NOT NULL
);


--
-- Name: detox_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detox_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    duration_minutes integer NOT NULL,
    end_time timestamp with time zone NOT NULL,
    blocked_apps text[] DEFAULT '{}'::text[] NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    xp_earned integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT detox_sessions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: exercise_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exercise_id text NOT NULL,
    gym_area text NOT NULL,
    thinking_mode text,
    difficulty text NOT NULL,
    xp_earned integer NOT NULL,
    score numeric DEFAULT 0,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    week_start date DEFAULT (date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date NOT NULL
);


--
-- Name: monthly_content_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_content_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    month_start date NOT NULL,
    content_type text NOT NULL,
    content_id text NOT NULL,
    title text NOT NULL,
    description text,
    duration_minutes integer,
    is_required boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    time_spent_minutes integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    session_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: neuro_gym_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.neuro_gym_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    area text NOT NULL,
    duration_option text NOT NULL,
    exercises_used text[] DEFAULT '{}'::text[] NOT NULL,
    score numeric DEFAULT 0 NOT NULL,
    correct_answers integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_daily_training boolean DEFAULT false,
    CONSTRAINT neuro_gym_sessions_area_check CHECK ((area = ANY (ARRAY['focus'::text, 'memory'::text, 'control'::text, 'reasoning'::text, 'creativity'::text, 'neuro-activation'::text]))),
    CONSTRAINT neuro_gym_sessions_duration_option_check CHECK ((duration_option = ANY (ARRAY['30s'::text, '1min'::text, '2min'::text, '3min'::text, '5min'::text, '7min'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text,
    age integer,
    gender text,
    work_type text,
    training_goals text[] DEFAULT '{}'::text[],
    session_duration text DEFAULT '2min'::text,
    daily_time_commitment text DEFAULT '10min'::text,
    subscription_status text DEFAULT 'free'::text,
    onboarding_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    birth_date date,
    education_level text,
    degree_discipline text,
    daily_sessions_count integer DEFAULT 0,
    last_session_date date,
    reminder_time time without time zone,
    reminder_enabled boolean DEFAULT false,
    training_plan text DEFAULT 'light'::text,
    daily_detox_goal_minutes integer DEFAULT 60,
    detox_reminder_enabled boolean DEFAULT true,
    detox_reminder_time text DEFAULT '20:00'::text
);


--
-- Name: training_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    training_mode public.exercise_category NOT NULL,
    duration_option public.exercise_duration NOT NULL,
    exercises_used text[] DEFAULT '{}'::text[] NOT NULL,
    score numeric DEFAULT 0 NOT NULL,
    correct_answers integer DEFAULT 0 NOT NULL,
    total_questions integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_id text NOT NULL,
    badge_name text NOT NULL,
    badge_description text,
    badge_category text NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_cognitive_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_cognitive_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reasoning_accuracy numeric DEFAULT 50 NOT NULL,
    clarity_score numeric DEFAULT 50 NOT NULL,
    decision_quality numeric DEFAULT 50 NOT NULL,
    fast_thinking numeric DEFAULT 50 NOT NULL,
    slow_thinking numeric DEFAULT 50 NOT NULL,
    bias_resistance numeric DEFAULT 50 NOT NULL,
    critical_thinking_score numeric DEFAULT 50 NOT NULL,
    creativity numeric DEFAULT 50 NOT NULL,
    philosophical_reasoning numeric DEFAULT 50 NOT NULL,
    total_sessions integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    visual_processing numeric DEFAULT 50 NOT NULL,
    spatial_reasoning numeric DEFAULT 50 NOT NULL,
    focus_stability numeric DEFAULT 50 NOT NULL,
    reaction_speed numeric DEFAULT 50 NOT NULL,
    cognitive_performance_score numeric,
    physio_component_score numeric,
    cognitive_readiness_score numeric,
    readiness_classification text,
    baseline_fast_thinking numeric,
    baseline_slow_thinking numeric,
    baseline_focus numeric,
    baseline_reasoning numeric,
    baseline_creativity numeric,
    baseline_cognitive_age integer,
    baseline_captured_at timestamp with time zone,
    cognitive_level integer DEFAULT 1,
    experience_points integer DEFAULT 0
);


--
-- Name: user_listened_podcasts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_listened_podcasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    podcast_id text NOT NULL,
    listened_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wearable_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wearable_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    source text NOT NULL,
    hrv_ms numeric,
    resting_hr numeric,
    sleep_duration_min numeric,
    sleep_efficiency numeric,
    activity_score numeric,
    raw_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: weekly_training_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_training_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    week_start date NOT NULL,
    plan_id text DEFAULT 'light'::text NOT NULL,
    sessions_completed jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cognitive_exercises cognitive_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cognitive_exercises
    ADD CONSTRAINT cognitive_exercises_pkey PRIMARY KEY (id);


--
-- Name: detox_completions detox_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detox_completions
    ADD CONSTRAINT detox_completions_pkey PRIMARY KEY (id);


--
-- Name: detox_sessions detox_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detox_sessions
    ADD CONSTRAINT detox_sessions_pkey PRIMARY KEY (id);


--
-- Name: exercise_completions exercise_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_completions
    ADD CONSTRAINT exercise_completions_pkey PRIMARY KEY (id);


--
-- Name: monthly_content_assignments monthly_content_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_content_assignments
    ADD CONSTRAINT monthly_content_assignments_pkey PRIMARY KEY (id);


--
-- Name: monthly_content_assignments monthly_content_assignments_user_id_month_start_content_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_content_assignments
    ADD CONSTRAINT monthly_content_assignments_user_id_month_start_content_id_key UNIQUE (user_id, month_start, content_id);


--
-- Name: neuro_gym_sessions neuro_gym_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neuro_gym_sessions
    ADD CONSTRAINT neuro_gym_sessions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: training_sessions training_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_user_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);


--
-- Name: user_cognitive_metrics user_cognitive_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cognitive_metrics
    ADD CONSTRAINT user_cognitive_metrics_pkey PRIMARY KEY (id);


--
-- Name: user_cognitive_metrics user_cognitive_metrics_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cognitive_metrics
    ADD CONSTRAINT user_cognitive_metrics_user_id_key UNIQUE (user_id);


--
-- Name: user_listened_podcasts user_listened_podcasts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listened_podcasts
    ADD CONSTRAINT user_listened_podcasts_pkey PRIMARY KEY (id);


--
-- Name: user_listened_podcasts user_listened_podcasts_user_id_podcast_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_listened_podcasts
    ADD CONSTRAINT user_listened_podcasts_user_id_podcast_id_key UNIQUE (user_id, podcast_id);


--
-- Name: wearable_snapshots wearable_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wearable_snapshots
    ADD CONSTRAINT wearable_snapshots_pkey PRIMARY KEY (id);


--
-- Name: wearable_snapshots wearable_snapshots_user_id_date_source_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wearable_snapshots
    ADD CONSTRAINT wearable_snapshots_user_id_date_source_key UNIQUE (user_id, date, source);


--
-- Name: weekly_training_progress weekly_training_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_training_progress
    ADD CONSTRAINT weekly_training_progress_pkey PRIMARY KEY (id);


--
-- Name: weekly_training_progress weekly_training_progress_user_id_week_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_training_progress
    ADD CONSTRAINT weekly_training_progress_user_id_week_start_key UNIQUE (user_id, week_start);


--
-- Name: idx_detox_completions_user_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detox_completions_user_week ON public.detox_completions USING btree (user_id, week_start);


--
-- Name: idx_detox_sessions_end_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detox_sessions_end_time ON public.detox_sessions USING btree (end_time) WHERE (status = 'active'::text);


--
-- Name: idx_detox_sessions_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detox_sessions_user_status ON public.detox_sessions USING btree (user_id, status);


--
-- Name: idx_exercise_completions_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercise_completions_user_date ON public.exercise_completions USING btree (user_id, completed_at);


--
-- Name: idx_exercise_completions_user_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercise_completions_user_week ON public.exercise_completions USING btree (user_id, week_start);


--
-- Name: idx_user_listened_podcasts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_listened_podcasts_user_id ON public.user_listened_podcasts USING btree (user_id);


--
-- Name: cognitive_exercises update_cognitive_exercises_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cognitive_exercises_updated_at BEFORE UPDATE ON public.cognitive_exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: detox_sessions update_detox_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_detox_sessions_updated_at BEFORE UPDATE ON public.detox_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: monthly_content_assignments update_monthly_content_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_monthly_content_assignments_updated_at BEFORE UPDATE ON public.monthly_content_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_cognitive_metrics update_user_cognitive_metrics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_cognitive_metrics_updated_at BEFORE UPDATE ON public.user_cognitive_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: wearable_snapshots update_wearable_snapshots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_wearable_snapshots_updated_at BEFORE UPDATE ON public.wearable_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: weekly_training_progress update_weekly_training_progress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_weekly_training_progress_updated_at BEFORE UPDATE ON public.weekly_training_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: training_sessions training_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_cognitive_metrics user_cognitive_metrics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cognitive_metrics
    ADD CONSTRAINT user_cognitive_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wearable_snapshots wearable_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wearable_snapshots
    ADD CONSTRAINT wearable_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cognitive_exercises Exercises are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Exercises are publicly readable" ON public.cognitive_exercises FOR SELECT USING (true);


--
-- Name: detox_sessions Users can create their own detox sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own detox sessions" ON public.detox_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: exercise_completions Users can delete their own exercise completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own exercise completions" ON public.exercise_completions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_listened_podcasts Users can delete their own listened podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own listened podcasts" ON public.user_listened_podcasts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_badges Users can insert their own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own badges" ON public.user_badges FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: monthly_content_assignments Users can insert their own content assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own content assignments" ON public.monthly_content_assignments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: detox_completions Users can insert their own detox completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own detox completions" ON public.detox_completions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: exercise_completions Users can insert their own exercise completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own exercise completions" ON public.exercise_completions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_listened_podcasts Users can insert their own listened podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own listened podcasts" ON public.user_listened_podcasts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_cognitive_metrics Users can insert their own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own metrics" ON public.user_cognitive_metrics FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: neuro_gym_sessions Users can insert their own neuro gym sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own neuro gym sessions" ON public.neuro_gym_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: training_sessions Users can insert their own training sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own training sessions" ON public.training_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wearable_snapshots Users can insert their own wearable snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own wearable snapshots" ON public.wearable_snapshots FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: weekly_training_progress Users can insert their own weekly progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own weekly progress" ON public.weekly_training_progress FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: monthly_content_assignments Users can update their own content assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own content assignments" ON public.monthly_content_assignments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: detox_sessions Users can update their own detox sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own detox sessions" ON public.detox_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_cognitive_metrics Users can update their own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own metrics" ON public.user_cognitive_metrics FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile except subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile except subscription" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: wearable_snapshots Users can update their own wearable snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own wearable snapshots" ON public.wearable_snapshots FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: weekly_training_progress Users can update their own weekly progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own weekly progress" ON public.weekly_training_progress FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_badges Users can view their own badges; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: monthly_content_assignments Users can view their own content assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own content assignments" ON public.monthly_content_assignments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: detox_completions Users can view their own detox completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own detox completions" ON public.detox_completions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: detox_sessions Users can view their own detox sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own detox sessions" ON public.detox_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: exercise_completions Users can view their own exercise completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own exercise completions" ON public.exercise_completions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_listened_podcasts Users can view their own listened podcasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own listened podcasts" ON public.user_listened_podcasts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_cognitive_metrics Users can view their own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own metrics" ON public.user_cognitive_metrics FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: neuro_gym_sessions Users can view their own neuro gym sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own neuro gym sessions" ON public.neuro_gym_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: training_sessions Users can view their own training sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own training sessions" ON public.training_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wearable_snapshots Users can view their own wearable snapshots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own wearable snapshots" ON public.wearable_snapshots FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: weekly_training_progress Users can view their own weekly progress; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own weekly progress" ON public.weekly_training_progress FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: cognitive_exercises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cognitive_exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: detox_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.detox_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: detox_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.detox_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: exercise_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: monthly_content_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.monthly_content_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: neuro_gym_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.neuro_gym_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: training_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_cognitive_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_cognitive_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: user_listened_podcasts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_listened_podcasts ENABLE ROW LEVEL SECURITY;

--
-- Name: wearable_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wearable_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_training_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_training_progress ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;