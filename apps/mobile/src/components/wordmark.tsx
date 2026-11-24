import { Text, View } from 'react-native';
import { fonts } from '@/lib/theme';

/** "gtrack" beside the ring-and-dot mark (accent ring, highlight dot). No logo exists yet. */
export function Wordmark() {
  return (
    <View
      className="flex-row items-center gap-2"
      accessibilityRole="header"
      accessibilityLabel="gtrack"
    >
      <View className="size-6 items-center justify-center rounded-full border-[5px] border-accent">
        <View className="size-2 rounded-full bg-highlight" />
      </View>
      <Text className="text-xl text-foreground" style={{ fontFamily: fonts.extraBold }}>
        gtrack
      </Text>
    </View>
  );
}
