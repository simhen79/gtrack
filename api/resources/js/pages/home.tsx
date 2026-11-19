import { Card } from '@heroui/react';
import { Head } from '@inertiajs/react';
import type { ShellProps } from '../layouts/app-shell';

export default function Home() {
    return (
        <div className="flex flex-col gap-4">
            <Head title="Home" />
            <Card className="max-w-sm">
                <Card.Header>
                    <Card.Title>gtrack</Card.Title>
                    <Card.Description>Golf practice, coming soon.</Card.Description>
                </Card.Header>
            </Card>
        </div>
    );
}

Home.layout = { title: 'Home' } satisfies ShellProps;
