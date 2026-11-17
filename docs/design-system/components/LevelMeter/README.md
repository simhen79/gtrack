# LevelMeter

A Game's Level (1–5) as five pips plus the words, built on HeroUI Meter (`value` 1–5, `maxValue` 5) so screen readers hear "Level 3 of 5".

- Pips 16×8, 4px corners, 4px gap; filled `highlight`, empty `surface-tertiary`.
- Always beside "Level N"; never pips alone.
- Level changes show as chips (see Chip): up `highlight`, held neutral, down outlined `sg-negative`.
- Never "tier", "grade" or "difficulty".
