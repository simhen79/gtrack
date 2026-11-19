import { Card, Chip } from 'heroui-native';
import { useEffect } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useSession } from '@/lib/session';
import { fonts } from '@/lib/theme';

export default function Home() {
  const { me, refresh } = useSession();

  // Coming back to the app re-checks the token, so a disabled or idle login
  // returns to sign-in.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  if (!me) return null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-4 pb-6">
      <Text className="text-[34px] text-foreground" style={{ fontFamily: fonts.serif }}>
        Home
      </Text>
      <Card>
        <Card.Body className="gap-3">
          <Card.Title>{me.email}</Card.Title>
          <Card.Description>Permissions</Card.Description>
          <View className="flex-row flex-wrap gap-2">
            {me.permissions.map((permission) => (
              <Chip key={permission}>{permission}</Chip>
            ))}
          </View>
        </Card.Body>
      </Card>
    </ScrollView>
  );
}
