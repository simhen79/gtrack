import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { AppState, View, type ColorValue } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { Icon, type IconName } from '@/components/icons';
import { TopRow } from '@/components/top-row';
import { useSession } from '@/lib/session';
import { fonts } from '@/lib/theme';

/**
 * The signed-in app: the top row of wordmark and avatar over each page, and the bottom tab bar.
 * A tab is added here when its page lands on the phone; Enter a Round joins as the raised
 * centre button with the phone's Round entry.
 */
export default function TabsLayout() {
  const { refresh } = useSession();

  // Coming back to the app re-checks the token, so a disabled or idle login
  // returns to sign-in, whichever tab is open.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const [surface, separator, foreground, muted] = useCSSVariable([
    '--color-surface',
    '--color-separator',
    '--color-foreground',
    '--color-muted',
  ]) as string[];

  return (
    <Tabs
      screenOptions={{
        header: () => <TopRow />,
        tabBarStyle: { backgroundColor: surface, borderTopColor: separator },
        tabBarActiveTintColor: foreground,
        tabBarInactiveTintColor: muted,
        tabBarLabelStyle: { fontFamily: fonts.extraBold, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: (props) => <TabIcon name="House" {...props} /> }} />
      {/* Not a tab: the avatar sheet opens it, as the web's avatar menu does at phone width. */}
      <Tabs.Screen name="practice-grounds" options={{ title: 'Practice Grounds', href: null }} />
    </Tabs>
  );
}

/** The current tab's icon sits in a segment pill. */
function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: ColorValue }) {
  const [segmentForeground] = useCSSVariable(['--color-segment-foreground']) as string[];

  return (
    <View className={`h-8 w-12 items-center justify-center rounded-full ${focused ? 'bg-segment' : ''}`}>
      <Icon name={name} color={focused ? segmentForeground : color} />
    </View>
  );
}
