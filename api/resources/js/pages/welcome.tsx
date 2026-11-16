import { Card } from '@heroui/react';
import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Head title="gtrack" />
            <Card className="w-full max-w-sm">
                <Card.Header>
                    <Card.Title>gtrack</Card.Title>
                    <Card.Description>Golf practice, coming soon.</Card.Description>
                </Card.Header>
            </Card>
        </main>
    );
}
