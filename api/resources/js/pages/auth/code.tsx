import { Button, InputOTP, Link, REGEXP_ONLY_DIGITS } from '@heroui/react';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { SignInLayout } from '../../layouts/sign-in';

export default function Code({ email }: { email: string }) {
    const form = useForm({ email, code: '' });
    const submit = () => form.post('/login', { onError: () => form.setData('code', '') });

    // The sixth digit submits, typed or pasted. A wrong code clears the slots, so this can't repeat.
    useEffect(() => {
        if (form.data.code.length === 6 && !form.processing) {
            submit();
        }
    }, [form.data.code]);

    return (
        <SignInLayout
            title="Check your email"
            description={
                <>
                    If <span className="font-bold text-foreground">{email}</span> has an invite, a 6-digit code is on its way. It works once, for
                    10 minutes.
                </>
            }
        >
            <form
                className="flex flex-col gap-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <div className="flex flex-col gap-2">
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
                        {/* 52×60 slots, a little narrower where six won't fit a phone's card. */}
                        <InputOTP.Group className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <InputOTP.Slot key={index} index={index} className="h-14 w-11 text-2xl font-extrabold sm:h-[60px] sm:w-[52px]" />
                            ))}
                        </InputOTP.Group>
                    </InputOTP>
                    {form.errors.code && (
                        <p role="alert" className="text-sm font-medium text-danger">
                            {form.errors.code}
                        </p>
                    )}
                </div>
                <Button type="submit" size="lg" fullWidth isPending={form.processing} isDisabled={form.data.code.length !== 6}>
                    Sign in
                </Button>
            </form>
            <Link href="/login" className="self-center text-sm">
                Use a different email or get a new code
            </Link>
        </SignInLayout>
    );
}
