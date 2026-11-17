# Alert

Inline messages that need reading: rules changed, no connection when generating, LLM cap reached, an SG Category skipped, a lapsed planned session.

- `warning` and `danger`: soft tint of the status colour over `surface` plus a 1px tinted outline, 18px corners, status-coloured icon, body text in foreground. One action at most (white `sm` button).
- Quiet notes (LLM cap, SG Category skipped): outline only, `small` muted text.
- Never use Alert for success; use Toast.
