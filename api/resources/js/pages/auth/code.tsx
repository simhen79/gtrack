import { Button, Card, InputOTP, Link, REGEXP_ONLY_DIGITS } from '@heroui/react';
import { Head, useForm } from '@inertiajs/react';

export default function Code({ email }: { email: string }) {
    const form = useForm({ email, code: '' });
    const submit = () => form.post('/login', { onError: () => form.setData('code', '') });

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Head title="Enter your code" />
            <Card className="w-full max-w-sm">
                <Card.Header>
                    <Card.Title>Check your email</Card.Title>
                    <Card.Description>
                        If {email} has an invite, a 6-digit code is on its way. It works once, for 10 minutes.
                    </Card.Description>
                </Card.Header>
                <Card.Content className="flex flex-col gap-4">
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submit();
                        }}
                    >
                        <InputOTP
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            autoComplete="one-time-code"
                            autoFocus
                            value={form.data.code}
                            onChange={(code) => form.setData('code', code)}
                            isInvalid={Boolean(form.errors.code)}
                            aria-label="6-digit code"
                        >
                            <InputOTP.Group>
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <InputOTP.Slot key={index} index={index} />
                                ))}
                            </InputOTP.Group>
                        </InputOTP>
                        {form.errors.code && (
                            <p role="alert" className="text-danger text-sm">
                                {form.errors.code}
                            </p>
                        )}
                        <Button type="submit" isPending={form.processing} isDisabled={form.data.code.length !== 6}>
                            Sign in
                        </Button>
                    </form>
                    <Link href="/login">Use a different email or get a new code</Link>
                </Card.Content>
            </Card>
        </main>
    );
}
