CREATE OR REPLACE FUNCTION public.mcp_audit(_kind text, _detail jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF _kind NOT IN ('mcp_list_missions','mcp_get_mission','mcp_create_mission','mcp_create_mission_refused') THEN
    RAISE EXCEPTION 'INVALID_KIND';
  END IF;
  IF pg_column_size(_detail) > 4000 THEN RAISE EXCEPTION 'DETAIL_TOO_LARGE'; END IF;
  INSERT INTO public.activity_log(user_id, kind, detail) VALUES (auth.uid(), _kind, coalesce(_detail,'{}'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.mcp_audit(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mcp_audit(text, jsonb) TO authenticated;