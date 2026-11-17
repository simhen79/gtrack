# Button

The action control: one `primary` (accent orange) per view, everything else secondary, ghost or danger.

| Variant (HeroUI `variant`) | gtrack use |
| --- | --- |
| `primary` | Enter a Round, Save Round, Publish v3, Start Practice Session |
| `secondary` | Variations, Regenerate, Swap |
| `ghost` / `tertiary` | Cancel, Change, ··· (32px icon-only), search |
| `danger` | Delete Round, Abandon, Delete my account |

- Corners 12px (`--field-radius`). Heights: 32 (sm, ··· menus), 44 (default web), 52 (forms), 64–128 in a live session.
- The white "Start it on your phone ↗" button is `secondary` with `bg-segment text-segment-foreground` and a trailing icon tile.
- ButtonGroup: buttons stay separate with an 8px gap. Cancel sits before Save.
- Disabled: 40% opacity, never a different colour.
- Phone: the same `heroui-native` Button variants; `size="lg"` in forms.
