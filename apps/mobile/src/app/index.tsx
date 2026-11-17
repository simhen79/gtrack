import { Button, Card, Chip, Typography } from 'heroui-native';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaView } from '@/components/safe-area-view';
import { useSession } from '@/lib/session';

export default function Home() {
  const { me, refresh, signOut } = useSession();

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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-6 p-6">
        <Typography.Heading type="h2">Signed in</Typography.Heading>
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
        <Button variant="secondary" onPress={signOut}>
          Sign out
        </Button>
      </View>
    </SafeAreaView>
  );
}
