# WeekStrip

The Weekly Plan as seven day tiles with one day open, built from ToggleButtonGroup semantics (one selected) on web and Tabs on phone.

- Tiles 18px corners (16 on phone), 86px tall on web: day, date in `stat` weight, planned minutes.
- Selected day (normally today): `highlight` fill. Planned: `surface-tertiary`. Rest: transparent with a 1px `border` and "Rest".
- Missed sessions simply lapse: no red, no "overdue"; a lapsed day goes back to looking like a Rest day.
- Below the strip, the open day's session: Practice Ground, Facilities, the SG Category split bar.
