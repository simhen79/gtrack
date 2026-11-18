// PROTOTYPE (#51 app shell) — throwaway. Branch prototype/51-app-shell only.
// Question: should the phone app keep #51's top row + menu (A), or match the web's
// chosen variant B with a bottom tab bar (B)? Both wrap the real Home screen.
// Switch with the pink bar. Tabs other than Home show a placeholder: no screens exist yet.

import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Uniwind, useCSSVariable, useUniwind } from 'uniwind';
import { Icon, type IconName } from './icons';

type Page = 'Home' | 'Rounds' | 'Trends' | 'Practice' | 'Practice Grounds' | 'Admin';

const nav: { page: Page; icon: IconName }[] = [
  { page: 'Home', icon: 'home' },
  { page: 'Rounds', icon: 'rounds' },
  { page: 'Trends', icon: 'trends' },
  { page: 'Practice', icon: 'practice' },
  { page: 'Practice Grounds', icon: 'pin' },
];

type ShellProps = {
  email: string;
  isAdmin: boolean;
  onSignOut: () => void;
  children: ReactNode;
};

function useColors() {
  const [fg, muted, accentFg, segmentFg] = useCSSVariable([
    '--color-foreground',
    '--color-muted',
    '--color-accent-foreground',
    '--color-segment-foreground',
  ]) as string[];
  return { fg: fg ?? '#fff', muted: muted ?? '#a3a3a3', accentFg: accentFg ?? '#161616', segmentFg: segmentFg ?? '#161616' };
}

function Wordmark() {
  return (
    <View className="flex-row items-center gap-2">
      <View className="size-6 items-center justify-center rounded-full border-4 border-accent">
        <View className="size-2 rounded-full bg-highlight" />
      </View>
      <Text className="text-xl font-extrabold text-foreground">gtrack</Text>
    </View>
  );
}

function AvatarButton({ email, onPress }: { email: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Account" className="size-10 items-center justify-center rounded-full bg-highlight">
      <Text className="text-sm font-extrabold text-highlight-foreground">{email.slice(0, 2).toUpperCase()}</Text>
    </Pressable>
  );
}

/** Hand-rolled bottom sheet (the real build uses HeroUI Native BottomSheet). */
function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <View className="gap-2 rounded-t-[24px] bg-overlay px-4 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="mb-2 h-1 w-10 self-center rounded-full bg-border" />
        {children}
      </View>
    </Modal>
  );
}

function SheetRow({ icon, label, onPress, danger, disabled }: { icon: IconName; label: string; onPress?: () => void; danger?: boolean; disabled?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={`h-14 flex-row items-center gap-3 rounded-[18px] bg-surface-secondary px-4 ${disabled ? 'opacity-40' : ''}`}
    >
      <Icon name={icon} color={danger ? '#FF7A66' : c.fg} />
      <Text className={`text-[15px] font-bold ${danger ? 'text-danger' : 'text-foreground'}`}>{label}</Text>
      {disabled && <Text className="ml-auto text-[13px] text-muted">Not built yet</Text>}
    </Pressable>
  );
}

type ThemeChoice = 'system' | 'dark' | 'light';

/** System / Dark / Light, as decided for #51. Prototype: not persisted across app restarts. */
function ThemePicker() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const current: ThemeChoice = hasAdaptiveThemes ? 'system' : theme === 'light' ? 'light' : 'dark';
  const options: { key: ThemeChoice; label: string }[] = [
    { key: 'system', label: 'System' },
    { key: 'dark', label: 'Dark' },
    { key: 'light', label: 'Light' },
  ];
  return (
    <View className="mb-1 flex-row gap-1 rounded-[14px] bg-surface-secondary p-1">
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => Uniwind.setTheme(o.key)}
          className={`h-10 flex-1 items-center justify-center rounded-[12px] ${current === o.key ? 'bg-segment' : ''}`}
        >
          <Text className={`text-[13px] font-bold ${current === o.key ? 'text-segment-foreground' : 'text-foreground'}`}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PlaceholderPage({ page }: { page: Page }) {
  return (
    <View className="rounded-[24px] bg-surface p-5">
      <Text className="text-[18px] font-bold text-foreground">{page}</Text>
      <Text className="mt-1 text-[13px] text-muted">Not built on the phone yet. The shell is what's being judged.</Text>
    </View>
  );
}

/** Variant A — #51 as written: top row of menu button, wordmark, avatar. Menu opens a sheet. */
function VariantA({ email, isAdmin, onSignOut, children }: ShellProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<Page>('Home');
  const [menu, setMenu] = useState(false);
  const [account, setAccount] = useState(false);
  const go = (p: Page) => {
    setPage(p);
    setMenu(false);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable onPress={() => setMenu(true)} accessibilityLabel="Menu" className="size-10 items-center justify-center rounded-[12px] bg-surface">
          <Icon name="menu" color={c.fg} />
        </Pressable>
        <Wordmark />
        <View className="ml-auto">
          <AvatarButton email={email} onPress={() => setAccount(true)} />
        </View>
      </View>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-40">
        <Text className="pt-2 text-[34px] text-foreground">{page}</Text>
        {page === 'Home' ? children : <PlaceholderPage page={page} />}
      </ScrollView>

      {/* One orange action per view: Enter a Round floats bottom-right. */}
      <Pressable className="absolute right-4 h-14 flex-row items-center gap-2 rounded-[14px] bg-accent px-5" style={{ bottom: insets.bottom + 16 }}>
        <Icon name="plus" color={c.accentFg} size={20} />
        <Text className="text-[15px] font-bold text-accent-foreground">Enter a Round</Text>
      </Pressable>

      <Sheet open={menu} onClose={() => setMenu(false)}>
        {nav.map((n) => (
          <SheetRow key={n.page} icon={n.icon} label={n.page} onPress={() => go(n.page)} disabled={n.page !== 'Home' && n.page !== 'Rounds'} />
        ))}
        {isAdmin && <SheetRow icon="shield" label="Admin" disabled />}
      </Sheet>
      <Sheet open={account} onClose={() => setAccount(false)}>
        <Text className="px-2 pb-2 text-[13px] text-muted">{email}</Text>
        <ThemePicker />
        <SheetRow icon="signOut" label="Sign out" onPress={onSignOut} danger />
      </Sheet>
    </View>
  );
}

/** Variant B — the web's choice carried over: top row + bottom tab bar with a centre + button. */
function VariantB({ email, isAdmin, onSignOut, children }: ShellProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<Page>('Home');
  const [account, setAccount] = useState(false);
  const tabs = nav.slice(0, 4);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Wordmark />
        <View className="ml-auto">
          <AvatarButton email={email} onPress={() => setAccount(true)} />
        </View>
      </View>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-48">
        <Text className="pt-2 text-[34px] text-foreground">{page}</Text>
        {page === 'Home' ? children : <PlaceholderPage page={page} />}
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-around border-t border-separator bg-surface px-2 pt-2" style={{ paddingBottom: insets.bottom + 4 }}>
        {tabs.slice(0, 2).map((t) => (
          <Tab key={t.page} icon={t.icon} label={t.page} current={page === t.page} onPress={() => setPage(t.page)} />
        ))}
        <Pressable accessibilityLabel="Enter a Round" className="-mt-6 size-14 items-center justify-center rounded-full bg-accent">
          <Icon name="plus" color={c.accentFg} size={26} />
        </Pressable>
        {tabs.slice(2).map((t) => (
          <Tab key={t.page} icon={t.icon} label={t.page} current={page === t.page} onPress={() => setPage(t.page)} />
        ))}
      </View>

      <Sheet open={account} onClose={() => setAccount(false)}>
        <Text className="px-2 pb-2 text-[13px] text-muted">{email}</Text>
        <ThemePicker />
        <SheetRow icon="pin" label="Practice Grounds" disabled />
        {isAdmin && <SheetRow icon="shield" label="Admin" disabled />}
        <SheetRow icon="signOut" label="Sign out" onPress={onSignOut} danger />
      </Sheet>
    </View>
  );
}

function Tab({ icon, label, current, onPress }: { icon: IconName; label: string; current: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} className="w-16 items-center gap-1">
      <View className={`h-8 w-12 items-center justify-center rounded-full ${current ? 'bg-segment' : ''}`}>
        <Icon name={icon} color={current ? c.segmentFg : c.muted} size={20} />
      </View>
      <Text className={`text-[11px] font-extrabold ${current ? 'text-foreground' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}

const variants = [
  { key: 'A', name: 'Top row + menu', Shell: VariantA },
  { key: 'B', name: 'Tab bar', Shell: VariantB },
];

export function PhoneShellPrototype(props: ShellProps) {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const v = variants[index];
  const step = (d: number) => setIndex((i) => (i + d + variants.length) % variants.length);

  return (
    <View className="flex-1">
      <v.Shell {...props} />
      {__DEV__ && (
        <View
          className="absolute flex-row items-center self-center rounded-full bg-[#ff00aa] p-1"
          style={{ bottom: insets.bottom + 96 }}
          pointerEvents="box-none"
        >
          <Pressable onPress={() => step(-1)} className="size-9 items-center justify-center">
            <Text className="font-bold text-white">←</Text>
          </Pressable>
          <Text className="px-2 font-mono text-[13px] text-white">
            PROTOTYPE {v.key} ({v.name})
          </Text>
          <Pressable onPress={() => step(1)} className="size-9 items-center justify-center">
            <Text className="font-bold text-white">→</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
