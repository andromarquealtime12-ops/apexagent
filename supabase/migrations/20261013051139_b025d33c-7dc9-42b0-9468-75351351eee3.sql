CREATE TABLE public.devices (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL DEFAULT 'Appareil',
  platform text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  location_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own devices select" ON public.devices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own devices insert" ON public.devices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own devices update" ON public.devices FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own devices delete" ON public.devices FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER t_devices_upd BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.apex_touch_updated_at();
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;