import { Button, Card, FieldError, Input, InputOTP, Label, REGEXP_ONLY_DIGITS, TextField } from 'heroui-native';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from '@/components/safe-area-view';
import { Wordmark } from '@/components/wordmark';
import { Invalid } from '@/lib/api';
import { useSession } from '@/lib/session';
import { fonts } from '@/lib/theme';

/** The web's sign-in pages on the phone: the wordmark, an Instrument Serif title and one card for each step. */
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

  // A wrong code clears the slots, as on the web, so the golfer types the next one fresh.
  const submitCode = (value: string) => run(async () => {
    try {
      await signIn(email, value);
    } catch (e) {
      setCode('');
      throw e;
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="grow gap-8 px-4 py-6" keyboardShouldPersistTaps="handled">
          <Wordmark />

          {step === 'email' ? (
            <>
              <Heading title="Sign in to gtrack">There’s no password. We’ll email you a 6-digit code.</Heading>
              <Card>
                <Card.Body className="gap-5">
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
                  <Button size="lg" isDisabled={busy || !email} onPress={() => run(async () => {
                    await sendCode(email);
                    setStep('code');
                  })}>
                    Email me a code
                  </Button>
                </Card.Body>
              </Card>
            </>
          ) : (
            <>
              <Heading title="Check your email">
                If <Text className="text-foreground" style={{ fontFamily: fonts.bold }}>{email}</Text> has an invite, a 6-digit code is on
                its way. It works once, for 10 minutes.
              </Heading>
              <Card>
                <Card.Body className="gap-5">
                  <View className="gap-2">
                    {/* The sixth digit submits, typed, pasted or filled from the keyboard's suggestion. */}
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={code}
                      onChange={setCode}
                      onComplete={submitCode}
                      isInvalid={!!error}
                      isDisabled={busy}
                      textInputProps={{ textContentType: 'oneTimeCode', autoComplete: 'one-time-code', autoFocus: true }}
                    >
                      <InputOTP.Group className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTP.Slot key={index} index={index} className="h-14 flex-1" />
                        ))}
                      </InputOTP.Group>
                    </InputOTP>
                    <FieldError isInvalid={!!error}>{error}</FieldError>
                  </View>
                  <Button size="lg" isDisabled={busy || code.length !== 6} onPress={() => submitCode(code)}>
                    Sign in
                  </Button>
                  <Button variant="ghost" isDisabled={busy} onPress={() => {
                    setCode('');
                    setError(null);
                    setStep('email');
                  }}>
                    Use a different email or get a new code
                  </Button>
                </Card.Body>
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Heading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-[34px] leading-[38px] text-foreground" style={{ fontFamily: fonts.serif }}>
        {title}
      </Text>
      <Text className="text-[15px] text-muted" style={{ fontFamily: fonts.body }}>
        {children}
      </Text>
    </View>
  );
}
