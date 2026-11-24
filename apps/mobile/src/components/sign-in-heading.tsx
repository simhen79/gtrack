import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { fonts } from '@/lib/theme';

/** A sign-in step's Instrument Serif title, with what to do under it. */
export function SignInHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text
        className="text-[34px] leading-[38px] text-foreground"
        style={{ fontFamily: fonts.serif }}
      >
        {title}
      </Text>
      <Text className="text-[15px] text-muted" style={{ fontFamily: fonts.body }}>
        {children}
      </Text>
    </View>
  );
}
