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

## Project rules
- Scheduling rules live as pure functions in src/lib/agenda.ts (tested in src/test/agenda.test.ts); localStorage access only in src/lib/store.ts — keeps rules testable and storage swappable.
- Message templates and manual WhatsApp share URLs are pure functions in src/lib/notificaciones.ts; automated messages never call services, and manual sharing requires user confirmation in WhatsApp.
- Bookings occupy ceil(duration/30) consecutive slots within one block — prevents overlaps for 45-min sessions.
- Store blocked slots as reservation records with a blocked status and a 30-minute fallback duration; attended records remain occupied — all availability paths share the same rules.
- Storage failures keep in-memory data and expose a global warning through the store hook — users must know reloads can lose changes.
