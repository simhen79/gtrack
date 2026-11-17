# Tabs

The web top navigation and the admin sub-navigation, built from HeroUI Tabs.

- Top nav: 40px pills on `surface`; the current page is the `segment` white pill with `segment-foreground`. Order: Home, Rounds, Trends, Practice, Practice Grounds, then Admin for admins only.
- Admin sub-nav (second row): 34px outline pills; current = `highlight` lime.
- At phone width the pills move into a Drawer opened by a menu button; ScrollShadow if they must scroll.
- Render tabs as links (`href`) so every page has a URL.
- Phone app: `heroui-native` Tabs for in-screen switches only (the app has no top nav).
