import { Alert, Card } from '@heroui/react';
import { Head, router, usePage } from '@inertiajs/react';
import { ConfirmDialog } from '../../components/confirm-dialog';
import type { ShellProps } from '../../layouts/app-shell';
import type { SharedProps } from '../../types';

export default function Settings() {
    return (
        <div className="flex flex-col gap-4">
            <Head title="Settings" />
            <DeleteAccount />
        </div>
    );
}

/** The confirm posts `confirm`, which the server requires, so nothing is deleted without it. */
function DeleteAccount() {
    const { errors } = usePage<SharedProps>().props;
    const error = errors.account ?? errors.confirm;

    return (
        <Card className="w-full max-w-sm">
            <Card.Header>
                <Card.Title>Delete my account</Card.Title>
                <Card.Description>
                    Permanently delete your account and everything in it, on the web and the phone.
                </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
                {error && (
                    <Alert status="danger">
                        <Alert.Content>
                            <Alert.Title>{error}</Alert.Title>
                        </Alert.Content>
                    </Alert>
                )}
                <ConfirmDialog
                    trigger="Delete my account"
                    triggerVariant="danger"
                    className="self-start"
                    heading="Delete your account?"
                    keep="Keep my account"
                    onConfirm={(visit) => router.delete('/settings/account', { data: { confirm: true }, ...visit })}
                >
                    This deletes every Round and Baseline you've entered, your settings and your account, and signs you out on the web and the
                    phone. It can't be undone.
                </ConfirmDialog>
            </Card.Content>
        </Card>
    );
}

Settings.layout = { title: 'Settings' } satisfies ShellProps;
