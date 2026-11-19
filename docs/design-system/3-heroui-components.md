# HeroUI component map

Every HeroUI v3 React component and every HeroUI Native component, with where gtrack uses it and what the gtrack theme changes. All of them take their colours, radii and fonts from the tokens, so any of them looks right without extra work. The **Styling** column only lists what goes beyond the tokens.

Platform: **W** = `@heroui/react` (web), **P** = `heroui-native` (phone). A dash means the component doesn't exist on that platform; use the one named instead.

## Actions

| Component | W | P | gtrack use | Styling |
| --- | --- | --- | --- | --- |
| Button | ✓ | ✓ | Enter a Round, Save Round, Publish, Start Practice Session, live Done / Cleared | `primary` = accent, one per view. `secondary` = default grey. `ghost`/`tertiary` = outline. `danger` for delete/Abandon. Corners 12px; live 14–16px at 64–128px tall |
| ButtonGroup | ✓ | – (Button row) | Cancel + Save pairs, Undo + Done on the pad | 8px gap, no joined edges |
| CloseButton | ✓ | ✓ | Close modals, sheets, toasts | 32px, outline `border` |
| LinkButton | – (Link) | ✓ | "Review past Practice Sessions", "All Rounds" | Text in foreground, underline on press |
| ToggleButton | ✓ | – (Tabs) | Show advanced stats; Grass, not mats | Off: outline; on: `highlight` |
| ToggleButtonGroup | ✓ | – (Tabs) | Scoring type (Counter / Points pad / Timer), Day/Week, 5/10/20 Rounds | Track `surface-secondary`, selected on `segment` |
| Toolbar | ✓ | – | Admin Catalogue filters, Round list actions | Pills with 8px gap |
| PressableFeedback | – | ✓ | Counter tap-anywhere area, Weekly Plan day tiles, Round rows | Scale 0.98 on press, no ripple colour |

## Navigation

| Component | W | P | gtrack use | Styling |
| --- | --- | --- | --- | --- |
| Tabs | ✓ | ✓ | In-page switches: Unplanned Session SG Category preview, Day/Week. Not the app nav (sidebar on web, Expo Router tabs on phone) | Each tab a 40px pill on `surface`, selected = `segment` white with `segment-foreground` |
| Link | ✓ | – (LinkButton) | Inline links in copy | `link` + underline |
| Breadcrumbs | ✓ | – | Rounds / New Round, Catalogue / Games | `small`, muted, current item foreground |
| Pagination | ✓ | – | Rounds list, past Practice Sessions | 32px square-ish pills, current = `segment` |
| Menu | – (Dropdown) | ✓ | ··· on cards, avatar menu | `overlay`, 12px item corners |
| Dropdown | ✓ | – (Menu) | ··· on cards; avatar menu (theme choice, Sign out, plus Practice Grounds and Admin at phone width) | `overlay` + `overlay-shadow`, items 40px |

## Forms

| Component | W | P | gtrack use | Styling |
| --- | --- | --- | --- | --- |
| Form | ✓ | – | Round entry, Game editor, Practice Ground editor, invite | Sections separated by 22px |
| Fieldset | ✓ | – | "Strokes Gained", "Needs", "Scoring" groups | Legend uses `card-title` |
| Label | ✓ | ✓ | Every field | `label` 13/700, colour `muted` on dark |
| Description | ✓ | ✓ | Help under fields: "Copy from your SG app…" | `small`, `muted` |
| FieldError / ErrorMessage | ✓ | ✓ | "Enter a number like −1.25" | `danger`, `small` |
| ControlField | – | ✓ | Wraps Checkbox/Switch/Radio with label + description | 44px min row |
| TextField + Input | ✓ | ✓ | Email, Practice Ground name, course | 52px, `field-background`, 1px `field-border`, focus 2px `focus` |
| InputGroup | ✓ | ✓ | **SG input** (± button + signed value), "min" suffix on minutes, "m" on distances | Prefix/suffix inside the field |
| NumberField | ✓ | – (Input + keypad) | Score, Handicap Index, Course Handicap, minutes, ball cap | Steppers hidden; SG uses InputGroup instead because it needs ± |
| InputOTP | ✓ | ✓ | 6-digit sign-in code | 6 slots 52×60, 12px corners, gap 8 |
| TextArea | ✓ | ✓ | Game rules, Practice Ground note | `body`, min 5 rows |
| SearchField | ✓ | ✓ | Header search, Catalogue search, course lookup | 44px, leading search icon |
| Select | ✓ | ✓ | Baseline, Holes, SG Category, Facility, Practice Ground | Trigger like a field; popover `overlay` |
| ComboBox | ✓ | – (Select) | Course (type to filter recent courses) | As Select |
| Autocomplete | ✓ | – | Admin: invite a golfer by email from past invites | As Select |
| ListBox | ✓ | – | Inside Select/ComboBox; Catalogue list in the Drafts side panel | Items 40px, selected = `highlight` dot |
| Checkbox / CheckboxGroup | ✓ | ✓ (Checkbox) | Facilities and their features (grass or mats, distance signs) | Checked fill `highlight`, mark `highlight-foreground` |
| RadioGroup | ✓ | ✓ | Baseline choice on first Round; scoring type on narrow screens | Selected ring `highlight` |
| Switch | ✓ | ✓ | Settings toggles; "Include warm-up" in Unplanned Session | On track `highlight` |
| Slider | ✓ | ✓ | Unplanned Session minutes (15–120), ball cap | Track `surface-tertiary`, fill `accent`, 28px thumb |
| DateField / DatePicker / Calendar | ✓ | – (native picker) | Round date | Calendar cells 40px, selected `segment`, today ring `highlight` |
| DateRangePicker / RangeCalendar | ✓ | – | Trends and past sessions date filter | Range fill `accent-soft` |
| TimeField | ✓ | – | Planned visit time in the Weekly Plan | As a field |
| TagGroup | ✓ | ✓ | Facilities at a Practice Ground, Draft tags | Tags are 32px chips, removable |
| ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch, ColorSwatchPicker | ✓ | – | Not used in v1. If an admin ever picks a category colour, use ColorSwatchPicker with the four cat-* tokens only | Swatches 12px corners |

## Data display

| Component | W | P | gtrack use | Styling |
| --- | --- | --- | --- | --- |
| Card | ✓ | ✓ | Every bento card; Game and Drill cards in the session preview | `surface`, 24px corners, no border, no shadow, padding 24 (web) / 18–20 (phone), header with ··· button |
| Surface | ✓ | ✓ | Rows and tiles inside cards; the carried-over details line | `surface-secondary`, 18px corners |
| Separator | ✓ | ✓ | Between list rows | `separator` |
| Table | ✓ | – (ListGroup) | Rounds list, past Practice Sessions, Users, Catalogue, LLM usage | Rows are `surface-secondary` tiles with 6px gaps rather than ruled lines; SG cells `stat-sm` with `sgTone` |
| ListGroup | – (Table) | ✓ | Rounds and sessions on phone; Practice Ground picker | Items 56px on `surface-secondary` |
| Chip | ✓ | ✓ | SG Category badges (OTT/APP/SHG/PUT), Level chips, status (Published v2), connection chip | 6px corners; category = `bg-cat-*` + `cat-foreground`; connection chip full-round (see Patterns) |
| Badge | ✓ | – (Chip) | Notification count on the avatar; "New" on Drafts | `accent` dot / count |
| Avatar / AvatarGroup | ✓ | ✓ (Avatar) | User avatar (initials on `highlight`); admin Users list | Full circle |
| Accordion / Disclosure / DisclosureGroup | ✓ | ✓ (Accordion) | Advanced Round stats, Game rules on web, Level details | `surface-secondary`, 18px corners, 56px header |
| Kbd | ✓ | – | Keyboard hints on desktop Round entry | `surface-tertiary`, 6px corners |
| Typography | ✓ | ✓ | All text: `hero`, `title`, `card-title`, `body`, `label`, `small`, number styles | Fonts Manrope / Instrument Serif, tabular figures |
| ScrollShadow | ✓ | ✓ | Long Session Item lists | Fade to `surface` |

## Feedback

| Component | W | P | gtrack use | Styling |
| --- | --- | --- | --- | --- |
| Alert | ✓ | ✓ | Rules changed → new version; no connection when generating; LLM cap reached; SG Category skipped | Soft tinted fill, icon, 18px corners; `warning`/`danger`/default |
| Toast | ✓ | ✓ | Round saved; session uploaded; invite sent | `overlay`, 18px corners, bottom-center |
| ProgressBar | ✓ | – (custom split bar) | Session upload progress; Weekly Plan minutes used | 8px track `surface-tertiary`, fill `accent` |
| ProgressCircle | ✓ | – | Weekly Plan completion ring on Home | 10px stroke, `highlight` on `surface-tertiary` |
| Meter | ✓ | – | Level 1–5 as pips; Proficiency; LLM monthly usage | Level: 5 pips filled `highlight` (see Patterns) |
| Skeleton / SkeletonGroup | ✓ | ✓ | Loading cards, charts and lists | `surface-tertiary` shimmer, same corners as the content |
| Spinner | ✓ | ✓ | Generation running, saving | `accent` on dark, 20/32px |
| Tooltip | ✓ | – | Chart values, truncated names, icon-only buttons, page names on the collapsed sidebar | White pill tooltip (`segment` + `segment-foreground`), 800 weight |

## Overlays

| Component | W | P | gtrack use | Styling |
| --- | --- | --- | --- | --- |
| Modal | ✓ | – (Dialog) | Change carried-over Round details, swap a Session Item | `overlay`, 24px corners, `overlay-shadow`, `backdrop` |
| AlertDialog | ✓ | – (Dialog) | Delete Round, Abandon session, delete account, Publish new version | Destructive confirms go through `ConfirmDialog` (see *Confirming* in the README): heading with the `danger` icon on its right, "Keep <thing>", confirm `danger`. Non-destructive confirms (Publish new version) use `primary` |
| Dialog | – (Modal) | ✓ | End session early, confirm swap | As Modal |
| Drawer | ✓ | – | Not used in v1: phone-width web navigates with the bottom tab bar | From the left, `surface` |
| Sheet | ✓ | – (BottomSheet) | Rules on the web session view, filters on narrow web | 24px top corners |
| BottomSheet | – (Sheet) | ✓ | Rules in a live session (Range), swap Session Item, Facility picker | `overlay` (Range: `surface` #141414), 24px top corners, big type |
| Popover | ✓ | ✓ | Select lists, date pickers, "why picked" detail | `overlay`, 18px corners |

## Coverage

All 73 web components and 39 phone components above are themed by the gtrack tokens. 67 web and all 39 phone components have a use in v1; the six colour components are themed but unused.
