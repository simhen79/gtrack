import { Button, Card, Link } from '@heroui/react';
import { Head, router, usePage } from '@inertiajs/react';
import type { SharedProps } from '../types';

export default function Welcome() {
    const { auth } = usePage<SharedProps>().props;

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Head title="gtrack" />
            <Card className="w-full max-w-sm">
                <Card.Header>
                    <Card.Title>gtrack</Card.Title>
                    <Card.Description>Golf practice, coming soon.</Card.Description>
                </Card.Header>
                <Card.Content className="flex flex-col gap-3">
                    <p className="text-sm break-all">Signed in as {auth.user?.email}</p>
                    <Link href="/rounds">Rounds</Link>
                    {auth.permissions.includes('users.manage') && <Link href="/admin/users">Manage users</Link>}
                </Card.Content>
                <Card.Footer>
                    <Button variant="secondary" onPress={() => router.post('/logout')}>
                        Sign out
                    </Button>
                </Card.Footer>
            </Card>
        </main>
    );
}
