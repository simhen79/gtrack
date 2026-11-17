# LiveScore

The live Practice Session screen: one Session Item at a time on the Range theme, built for sun, gloves and glances.

- Range theme only: black ground, white text, `accent` lime for the one forward action, `highlight` orange for the current progress segment.
- Header: End (ghost, 12px corners), item count, ConnectionChip; a 9-segment progress bar.
- Item: SG Category badge, "Game · Level 3 · Range bay", Rules button, the Game name at 34px.
- Score: `live-score` (156px) or `live-clock` (112px), tabular. The counter's tap-anywhere area is a `surface` button 20px corners filling the free space.
- Controls at least 64px tall with 14–16px corners: −1 / Miss / Done, the pad (0–3 + Undo), or Cleared / Back one hole. −1, Undo and Back one hole are always one tap away.
- Built from heroui-native Button and PressableFeedback; the layout itself is custom.
