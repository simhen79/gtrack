import { Button, Card, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { Head, useForm } from '@inertiajs/react';

export default function Login() {
    const form = useForm({ email: '' });

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Head title="Sign in" />
            <Card className="w-full max-w-sm">
                <Card.Header>
                    <Card.Title>Sign in to gtrack</Card.Title>
                    <Card.Description>We'll email you a 6-digit code.</Card.Description>
                </Card.Header>
                <Card.Content>
                    <Form
                        className="flex flex-col gap-4"
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
                            isRequired
                            value={form.data.email}
                            onChange={(email) => form.setData('email', email)}
                        >
                            <Label>Email</Label>
                            <Input />
                            <FieldError />
                        </TextField>
                        <Button type="submit" isPending={form.processing}>
                            Email me a code
                        </Button>
                    </Form>
                </Card.Content>
            </Card>
        </main>
    );
}
