# Toast

Short confirmations that need no reading: Round saved, session uploaded, invite sent.

- `overlay` with `overlay-shadow`, 18px corners, a status disc on the left, bold title, optional `small` line and one `sm` action.
- Bottom-centre on web, above the home indicator on phone; 5 seconds, longer when it has an action.
- Errors that need an action are Alerts, not Toasts.
- Web: a controller confirms a completed action with `$this->toast('Round saved', $round->course_name)` before it redirects, never a page of its own. Inertia's flash carries it, so Back doesn't show it again. A request that fails with a 5xx, a 419, a 429, another error that isn't an Inertia page or no connection raises a `danger` Toast, naming what didn't happen and what to do, from `api/resources/js/components/toasts.tsx` and leaves the form as it was. A form that comes back with errors shows no Toast.
