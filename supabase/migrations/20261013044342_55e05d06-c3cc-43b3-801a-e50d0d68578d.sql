CREATE OR REPLACE FUNCTION public.apex_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Preferences
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  notifications_internal boolean NOT NULL DEFAULT true,
  notifications_push boolean NOT NULL DEFAULT false,
  capture_consent boolean NOT NULL DEFAULT false,
  sensitivity int NOT NULL DEFAULT 40,
  cooldown_s int NOT NULL DEFAULT 10,
  retention_days int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs select" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_prefs_upd BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.apex_touch_updated_at();

-- Missions
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  theme text NOT NULL,
  region text NOT NULL,
  budget_min numeric NOT NULL DEFAULT 0,
  budget_max numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  skills text[] NOT NULL DEFAULT '{}',
  horizon text NOT NULL DEFAULT '3 mois',
  success_criteria text NOT NULL DEFAULT '',
  weights jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','running','paused','completed','failed','cancelled')),
  progress int NOT NULL DEFAULT 0,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own missions select" ON public.missions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own missions insert draft" ON public.missions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'draft' AND progress = 0);
CREATE POLICY "own missions delete" ON public.missions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER t_missions_upd BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.apex_touch_updated_at();

-- Opportunities (server-written)
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  canonical_key text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  stable_id text,
  facts jsonb NOT NULL DEFAULT '[]', inferences jsonb NOT NULL DEFAULT '[]',
  hypotheses jsonb NOT NULL DEFAULT '[]', projections jsonb NOT NULL DEFAULT '[]',
  confidence numeric NOT NULL DEFAULT 0,
  risks jsonb NOT NULL DEFAULT '[]', missing_data jsonb NOT NULL DEFAULT '[]',
  next_experiment text NOT NULL DEFAULT '',
  sources jsonb NOT NULL DEFAULT '[]',
  criteria jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, canonical_key)
);
GRANT SELECT ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own opps select" ON public.opportunities FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Approvals (server-written, decided via function)
CREATE TABLE public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired','cancelled')),
  action text NOT NULL, target text NOT NULL, impact text NOT NULL,
  cost text, data text NOT NULL DEFAULT '',
  evidence jsonb NOT NULL DEFAULT '[]', choices jsonb NOT NULL DEFAULT '[]',
  recommendation text NOT NULL DEFAULT '', next_step text NOT NULL DEFAULT '',
  decision text, decided_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own approvals select" ON public.approvals FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Home sessions
CREATE TABLE public.home_monitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  capture_enabled boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.home_monitor_sessions TO authenticated;
GRANT ALL ON public.home_monitor_sessions TO service_role;
ALTER TABLE public.home_monitor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions select" ON public.home_monitor_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sessions insert" ON public.home_monitor_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sessions update" ON public.home_monitor_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_sessions_upd BEFORE UPDATE ON public.home_monitor_sessions FOR EACH ROW EXECUTE FUNCTION public.apex_touch_updated_at();

-- Home events
CREATE TABLE public.home_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid NOT NULL REFERENCES public.home_monitor_sessions(id) ON DELETE CASCADE,
  confidence numeric NOT NULL,
  capture_path text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_events TO authenticated;
GRANT ALL ON public.home_events TO service_role;
ALTER TABLE public.home_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events select" ON public.home_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.home_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own events update" ON public.home_events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own events delete" ON public.home_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Alerts
CREATE TABLE public.home_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.home_alerts TO authenticated;
GRANT ALL ON public.home_alerts TO service_role;
ALTER TABLE public.home_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own alerts select" ON public.home_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own alerts mark read" ON public.home_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
REVOKE UPDATE ON public.home_alerts FROM authenticated;
GRANT UPDATE (read) ON public.home_alerts TO authenticated;

-- Assistant messages
CREATE TABLE public.assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msgs select" ON public.assistant_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own msgs insert" ON public.assistant_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role = 'user');
CREATE POLICY "own msgs delete" ON public.assistant_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own log select" ON public.activity_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Mission transitions (atomic)
CREATE OR REPLACE FUNCTION public.mission_transition(_mission_id uuid, _action text)
RETURNS public.missions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.missions; nxt text; allowed text[];
BEGIN
  SELECT * INTO m FROM public.missions WHERE id = _mission_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MISSION_NOT_FOUND'; END IF;
  CASE _action
    WHEN 'launch' THEN allowed := ARRAY['draft']; nxt := 'queued';
    WHEN 'pause' THEN allowed := ARRAY['queued','running']; nxt := 'paused';
    WHEN 'resume' THEN allowed := ARRAY['paused']; nxt := 'running';
    WHEN 'cancel' THEN allowed := ARRAY['draft','queued','running','paused']; nxt := 'cancelled';
    WHEN 'retry' THEN allowed := ARRAY['failed','cancelled']; nxt := 'queued';
    ELSE RAISE EXCEPTION 'INVALID_ACTION';
  END CASE;
  IF NOT (m.status = ANY(allowed)) THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;
  UPDATE public.missions SET status = nxt,
    progress = CASE WHEN _action = 'retry' THEN 0 ELSE progress END,
    history = history || jsonb_build_array(jsonb_build_object('at', now(), 'from', m.status, 'to', nxt))
  WHERE id = _mission_id RETURNING * INTO m;
  INSERT INTO public.activity_log(user_id, kind, detail) VALUES (auth.uid(), 'mission_transition', jsonb_build_object('mission_id', _mission_id, 'action', _action, 'to', nxt));
  RETURN m;
END; $$;
REVOKE EXECUTE ON FUNCTION public.mission_transition(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mission_transition(uuid, text) TO authenticated;

-- Single-use approval decision
CREATE OR REPLACE FUNCTION public.approval_decide(_approval_id uuid, _decision text, _choice text DEFAULT NULL)
RETURNS public.approvals LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.approvals;
BEGIN
  IF _decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'INVALID_DECISION'; END IF;
  SELECT * INTO a FROM public.approvals WHERE id = _approval_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'APPROVAL_NOT_FOUND'; END IF;
  IF a.status <> 'pending' THEN RAISE EXCEPTION 'APPROVAL_NOT_PENDING'; END IF;
  IF a.expires_at < now() THEN
    UPDATE public.approvals SET status = 'expired' WHERE id = _approval_id;
    RAISE EXCEPTION 'APPROVAL_EXPIRED';
  END IF;
  UPDATE public.approvals SET status = _decision, decision = _choice, decided_at = now() WHERE id = _approval_id RETURNING * INTO a;
  INSERT INTO public.activity_log(user_id, kind, detail) VALUES (auth.uid(), 'approval_decision', jsonb_build_object('approval_id', _approval_id, 'decision', _decision));
  RETURN a;
END; $$;
REVOKE EXECUTE ON FUNCTION public.approval_decide(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approval_decide(uuid, text, text) TO authenticated;

-- Alert on each home event
CREATE OR REPLACE FUNCTION public.home_event_alert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.home_alerts(user_id, kind, title, body, link)
  VALUES (NEW.user_id, 'home', 'Mouvement détecté', 'Confiance ' || round(NEW.confidence * 100) || ' %', NEW.id::text);
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.home_event_alert() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER t_home_event_alert AFTER INSERT ON public.home_events FOR EACH ROW EXECUTE FUNCTION public.home_event_alert();

-- Delete alerts linked to a deleted event
CREATE OR REPLACE FUNCTION public.home_event_cleanup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.home_alerts WHERE link = OLD.id::text AND user_id = OLD.user_id;
  RETURN OLD;
END; $$;
REVOKE EXECUTE ON FUNCTION public.home_event_cleanup() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER t_home_event_cleanup AFTER DELETE ON public.home_events FOR EACH ROW EXECUTE FUNCTION public.home_event_cleanup();

ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_alerts;

-- Private captures storage: owner folder only
CREATE POLICY "captures own read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'home-captures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "captures own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'home-captures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "captures own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'home-captures' AND (storage.foldername(name))[1] = auth.uid()::text);