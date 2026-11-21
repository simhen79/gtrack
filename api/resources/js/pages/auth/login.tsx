import { Button, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { useForm } from '@inertiajs/react';
import { SignInLayout } from '../../layouts/sign-in';

export default function Login() {
    const form = useForm({ email: '' });

    return (
        <SignInLayout title="Sign in to gtrack" description="There's no password. We'll email you a 6-digit code.">
            <Form
                className="flex flex-col gap-5"
                validationErrors={form.errors}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post('/login/code');
                }}
            >
                <TextField
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    isRequired
                    value={form.data.email}
                    onChange={(email) => form.setData('email', email)}
                >
                    <Label>Email</Label>
                    <Input placeholder="you@example.com" />
                    <FieldError />
                </TextField>
                <Button type="submit" size="lg" fullWidth isPending={form.processing}>
                    Email me a code
                </Button>
            </Form>
        </SignInLayout>
    );
}
