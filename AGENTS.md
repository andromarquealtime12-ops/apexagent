<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## APEX
- All app data goes through `src/lib/apex/store.ts` (in-memory state synced with RLS tables; sensitive transitions via SECURITY DEFINER RPCs), so UI code never talks to the database directly.
- Domain rules (scoring, dedupe, mission transitions) live as pure functions in `src/lib/apex/` with tests in `src/test/apex.test.ts`, so server code can reuse them.
- Camera starts only from an explicit user click in `useMotionMonitor`; never auto-start, never request audio.
