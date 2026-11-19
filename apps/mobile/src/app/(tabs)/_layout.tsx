import { Tabs } from 'expo-router/js-tabs';
import { View, type ColorValue } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { Icon, type IconName } from '@/components/icons';
import { TopRow } from '@/components/top-row';
import { fonts } from '@/lib/theme';

/**
 * The signed-in app: the top row of wordmark and avatar over each page, and the bottom tab bar.
 * A tab is added here when its page lands on the phone; Enter a Round joins as the raised
 * centre button with the phone's Round entry.
 */
export default function TabsLayout() {
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
