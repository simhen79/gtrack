# ConnectionChip

Always-visible connection status in the live Practice Session header, a full-round Chip.

| State | Outline | Mark | Words |
| --- | --- | --- | --- |
| Online | solid `success` | filled dot | Online |
| Offline | dashed `warning` | crossed signal | Offline · N scores saved |
| Uploading | solid foreground | up arrow | Uploading N of M |

- Outline style, icon and words all change, so it reads without colour.
- It never blocks scoring: nothing is lost offline. Tapping it explains what is queued.
- On web the read-only "Session in progress" page shows the same chip.
