import { Button, FieldError, Input, Label, TextField, Typography } from 'heroui-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from '@/components/safe-area-view';
import { Invalid } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function SignIn() {
  const { sendCode, signIn } = useSession();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Invalid ? e.message
        : e instanceof TypeError ? 'Couldn’t reach the server. Check your connection and try again.'
        : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center gap-6 p-6">
        <Typography.Heading type="h2">Sign in</Typography.Heading>

        {step === 'email' ? (
          <View className="gap-4">
            <TextField isInvalid={!!error}>
              <Label>Email</Label>
              <Input
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@example.com"
              />
              <FieldError>{error}</FieldError>
            </TextField>
            <Button isDisabled={busy || !email} onPress={() => run(async () => {
              await sendCode(email);
              setStep('code');
            })}>
              Email me a code
            </Button>
          </View>
        ) : (
          <View className="gap-4">
            <Typography>If {email} has been invited, a 6-digit code is on its way.</Typography>
            <TextField isInvalid={!!error}>
              <Label>Code</Label>
              <Input
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
              />
              <FieldError>{error}</FieldError>
            </TextField>
            <Button isDisabled={busy || code.length !== 6} onPress={() => run(() => signIn(email, code))}>
              Sign in
            </Button>
            <Button variant="ghost" isDisabled={busy} onPress={() => {
              setCode('');
              setError(null);
              setStep('email');
            }}>
              Use a different email
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
