import { Alert, AlertDialog, Button, Card } from '@heroui/react';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
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
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const destroy = () =>
        router.delete('/settings/account', {
            data: { confirm: true },
            onStart: () => setDeleting(true),
            onError: () => setOpen(false),
            onFinish: () => setDeleting(false),
        });

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
                <AlertDialog isOpen={open} onOpenChange={setOpen}>
                    <Button variant="danger" className="self-start">
                        Delete my account
                    </Button>
                    <AlertDialog.Backdrop>
                        <AlertDialog.Container>
                            <AlertDialog.Dialog className="sm:max-w-[420px]">
                                <AlertDialog.Header>
                                    <AlertDialog.Icon status="danger" />
                                    <AlertDialog.Heading>Delete your account?</AlertDialog.Heading>
                                </AlertDialog.Header>
                                <AlertDialog.Body>
                                    <p className="text-muted">
                                        This deletes every Round and Baseline you've entered, your settings and your
                                        account, and signs you out on the web and the phone. It can't be undone.
                                    </p>
                                </AlertDialog.Body>
                                <AlertDialog.Footer>
                                    <Button slot="close" variant="tertiary">
                                        Keep my account
                                    </Button>
                                    <Button variant="danger" isPending={deleting} onPress={destroy}>
                                        Delete my account
                                    </Button>
                                </AlertDialog.Footer>
                            </AlertDialog.Dialog>
                        </AlertDialog.Container>
                    </AlertDialog.Backdrop>
                </AlertDialog>
            </Card.Content>
        </Card>
    );
}

Settings.layout = { title: 'Settings' } satisfies ShellProps;
