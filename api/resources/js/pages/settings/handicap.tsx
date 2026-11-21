import { Button, Card, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { Head, useForm } from '@inertiajs/react';
import type { ShellProps } from '../../layouts/app-shell';

export default function Handicap({ fallback_handicap_index }: { fallback_handicap_index: string | null }) {
    const form = useForm({ fallback_handicap_index: fallback_handicap_index ?? '' });

    return (
        <div>
            <Head title="Your Handicap Index" />
            <Card className="w-full max-w-md gap-5 p-6">
                <Card.Header className="gap-1">
                    <Card.Title className="text-lg font-bold">What's your Handicap Index?</Card.Title>
                    <Card.Description>Games start at a Level that suits it until you've entered a Round.</Card.Description>
                </Card.Header>
                <Card.Content>
                    <Form
                        className="flex flex-col gap-5"
                        validationErrors={form.errors}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/settings/handicap');
                        }}
                    >
                        <TextField
                            name="fallback_handicap_index"
                            inputMode="decimal"
                            autoFocus
                            isRequired
                            value={form.data.fallback_handicap_index}
                            onChange={(value) => form.setData('fallback_handicap_index', value)}
                        >
                            <Label>Handicap Index</Label>
                            <Input placeholder="12.4" />
                            <FieldError />
                        </TextField>
                        <Button type="submit" size="lg" className="self-start" isPending={form.processing}>
                            Save Handicap Index
                        </Button>
                    </Form>
                </Card.Content>
            </Card>
        </div>
    );
}

Handicap.layout = { title: 'Handicap Index' } satisfies ShellProps;
