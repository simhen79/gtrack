# Tabs

In-page switches, built from HeroUI Tabs (web) and `heroui-native` Tabs (phone). Tabs are not the app's navigation: that's the web sidebar and the bottom tab bar, described under Layout in the design-system README.

- 40px pills on `surface`; the selected tab is the `segment` white pill with `segment-foreground`.
- Use them for switches inside a page: the Unplanned Session SG Category preview, Day / Week.
- When each tab is its own page, render tabs as links (`href`) so every page has a URL.
- `preview.html` still shows them as the old top nav; read the pill styling from it, not the layout.
