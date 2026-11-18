import { Card, Chip } from 'heroui-native';
import { useEffect } from 'react';
import { AppState, Text, View } from 'react-native';
import { useSession } from '@/lib/session';
import { PhoneShellPrototype } from '@/prototype/app-shell/phone-shell';

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

  // PROTOTYPE (#51): the Home content inside the shell variants. Sign out moved into the shell.
  return (
    <PhoneShellPrototype email={me.email} isAdmin={me.permissions.includes('users.manage')} onSignOut={signOut}>
      <View className="rounded-[24px] bg-surface p-5">
        <Text className="text-[13px] font-bold text-muted">Last Round · sample</Text>
        <Text className="mt-1 text-[32px] font-extrabold text-sg-negative">−2.10</Text>
        <Text className="text-[13px] text-muted">Strokes Gained vs Scratch</Text>
      </View>
      <View className="rounded-[24px] bg-surface p-5">
        <Text className="text-[13px] font-bold text-muted">This week · sample</Text>
        <Text className="mt-1 text-[18px] font-bold text-foreground">2 Practice Sessions planned</Text>
      </View>
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
    </PhoneShellPrototype>
  );
}
