import { Avatar, BottomSheet, Tabs } from 'heroui-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { Icon } from '@/components/icons';
import { Wordmark } from '@/components/wordmark';
import { useSession } from '@/lib/session';
import { fonts, setThemeChoice, useThemeChoice, type ThemeChoice } from '@/lib/theme';

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

/** The wordmark and the avatar, whose sheet holds the email, the theme choice, the pages that aren't tabs and Sign out. */
export function TopRow() {
  const { me, signOut } = useSession();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const email = me?.email ?? '';

  return (
    <View
      className="flex-row items-center justify-between bg-background px-4 pb-3"
      style={{ paddingTop: insets.top + 12 }}
    >
      <Wordmark />
      <BottomSheet isOpen={open} onOpenChange={setOpen}>
        <BottomSheet.Trigger asChild>
          <Pressable className="ml-auto" accessibilityRole="button" accessibilityLabel="Account">
            <Avatar alt={email} size="sm" className="bg-highlight">
              <Avatar.Fallback className="bg-highlight">
                <Text
                  className="text-sm text-highlight-foreground"
                  style={{ fontFamily: fonts.extraBold }}
                >
                  {email.slice(0, 2).toUpperCase()}
                </Text>
              </Avatar.Fallback>
            </Avatar>
          </Pressable>
        </BottomSheet.Trigger>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            backgroundClassName="rounded-t-[24px] bg-overlay"
            contentContainerClassName="gap-2 p-5"
          >
            <BottomSheet.Title className="text-[13px] text-muted">{email}</BottomSheet.Title>
            <ThemeChoicePicker />
            <PracticeGroundsRow
              onPress={() => {
                setOpen(false);
                router.push('/practice-grounds');
              }}
            />
            <SignOutRow
              onPress={() => {
                setOpen(false);
                signOut();
              }}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}

/** System, Dark or Light. The phone has no ToggleButtonGroup, so it's Tabs styled the same way. */
function ThemeChoicePicker() {
  const choice = useThemeChoice();

  return (
    <Tabs value={choice} onValueChange={(value) => setThemeChoice(value as ThemeChoice)}>
      <Tabs.List className="rounded-[14px] bg-surface-secondary p-1">
        <Tabs.Indicator className="rounded-[10px] bg-segment" />
        {THEMES.map(({ id, label }) => (
          <Tabs.Trigger key={id} value={id} className="h-10 flex-1">
            <Tabs.Label
              className={`text-[13px] ${choice === id ? 'text-segment-foreground' : 'text-foreground'}`}
              style={{ fontFamily: fonts.bold }}
            >
              {label}
            </Tabs.Label>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

function PracticeGroundsRow({ onPress }: { onPress: () => void }) {
  const [foreground] = useCSSVariable(['--color-foreground']) as string[];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-14 flex-row items-center gap-3 rounded-[18px] bg-surface-secondary px-4"
    >
      <Icon name="MapPin" color={foreground} />
      <Text className="text-[15px] text-foreground" style={{ fontFamily: fonts.bold }}>
        Practice Grounds
      </Text>
    </Pressable>
  );
}

function SignOutRow({ onPress }: { onPress: () => void }) {
  const [danger] = useCSSVariable(['--color-danger']) as string[];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-14 flex-row items-center gap-3 rounded-[18px] bg-surface-secondary px-4"
    >
      <Icon name="ArrowRightFromSquare" color={danger} />
      <Text className="text-[15px] text-danger" style={{ fontFamily: fonts.bold }}>
        Sign out
      </Text>
    </Pressable>
  );
}
