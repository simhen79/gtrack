import { Button, Card, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { Head, useForm } from '@inertiajs/react';

export default function Handicap({ fallback_handicap_index }: { fallback_handicap_index: string | null }) {
    const form = useForm({ fallback_handicap_index: fallback_handicap_index ?? '' });

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Head title="Your Handicap Index" />
            <Card className="w-full max-w-sm">
                <Card.Header>
                    <Card.Title>What's your Handicap Index?</Card.Title>
                    <Card.Description>
                        Games start at a Level that suits it until you've entered a Round.
                    </Card.Description>
                </Card.Header>
                <Card.Content>
                    <Form
                        className="flex flex-col gap-4"
                        validationErrors={form.errors}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/settings/handicap');
                        }}
                    >
                        <TextField
                            name="fallback_handicap_index"
                            inputMode="decimal"
                            isRequired
                            value={form.data.fallback_handicap_index}
                            onChange={(value) => form.setData('fallback_handicap_index', value)}
                        >
                            <Label>Handicap Index</Label>
                            <Input placeholder="e.g. 12.4" />
                            <FieldError />
                        </TextField>
                        <Button type="submit" isPending={form.processing}>
                            Save
                        </Button>
                    </Form>
                </Card.Content>
            </Card>
        </main>
    );
}
