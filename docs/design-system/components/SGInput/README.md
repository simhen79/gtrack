# SGInput

Signed Strokes Gained entry, one row per SG Category. Built from HeroUI InputGroup (web) / InputGroup (phone) with a ± Button.

- Row: `surface-secondary` tile, 16px corners; category badge, name, value field (180×56, `background` fill, 12px corners, `stat` type right-aligned), then the ± button (48px, ghost) on its right, so the golfer types the number and then flips its sign. Distance bands use the same field.
- The value is coloured by sign (`sg-positive`, `sg-negative`) and always shown as `+0.12` / `−2.85`.
- Web with a keyboard: plain text input with `inputMode="decimal"`. Typing `+` or `-` sets the sign; Enter moves to the next SG Category in order OTT, APP, SHG, PUT.
- Touch: the custom SG keypad (± and Next) replaces the system keyboard.
- The focused row gets a 2px `highlight` inset ring.
- Parse with `parseSG` and display with `formatSG` (`code/sg.ts`).
