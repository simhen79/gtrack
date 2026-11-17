import { Alert, Button, Card, Checkbox, Chip, FieldError, Form, Input, Label, TextField } from '@heroui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { AdminUser, Role, SharedProps } from '../../types';

const ROLES: Role[] = ['admin', 'golfer'];

export default function Users({ users }: { users: AdminUser[] }) {
    const { errors } = usePage<SharedProps>().props;
    const invite = useForm({ email: '' });
    const actionError = errors.roles ?? errors.disable ?? errors.invite;

    const toggleRole = (user: AdminUser, role: Role, on: boolean) => {
        const roles = on ? [...user.roles, role] : user.roles.filter((r) => r !== role);
        router.put(`/admin/users/${user.id}/roles`, { roles }, { preserveScroll: true });
    };

    return (
        <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
            <Head title="Users" />
            <h1 className="text-2xl font-semibold">Users</h1>

            <Card>
                <Card.Header>
                    <Card.Title>Invite a golfer</Card.Title>
                </Card.Header>
                <Card.Content>
                    <Form
                        className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        validationErrors={invite.errors}
                        onSubmit={(event) => {
                            event.preventDefault();
                            invite.post('/admin/users', { preserveScroll: true, onSuccess: () => invite.reset() });
                        }}
                    >
                        <TextField
                            className="grow"
                            name="email"
                            type="email"
                            isRequired
                            value={invite.data.email}
                            onChange={(email) => invite.setData('email', email)}
                        >
                            <Label>Email</Label>
                            <Input />
                            <FieldError />
                        </TextField>
                        <Button type="submit" isPending={invite.processing}>
                            Send invite
                        </Button>
                    </Form>
                </Card.Content>
            </Card>

            {actionError && (
                <Alert status="danger">
                    <Alert.Content>
                        <Alert.Title>{actionError}</Alert.Title>
                    </Alert.Content>
                </Alert>
            )}

            <ul className="flex flex-col gap-3">
                {users.map((user) => (
                    <li key={user.id}>
                        <Card>
                            <Card.Content className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium break-all">{user.email}</span>
                                    <Status user={user} />
                                </div>
                                <p className="text-muted text-sm">
                                    Last sign-in:{' '}
                                    {user.last_signed_in_at ? new Date(user.last_signed_in_at).toLocaleString() : 'never'}
                                </p>
                                <div className="flex flex-wrap items-center gap-4">
                                    {ROLES.map((role) => (
                                        <Checkbox
                                            key={role}
                                            isSelected={user.roles.includes(role)}
                                            onChange={(on) => toggleRole(user, role, on)}
                                        >
                                            <Checkbox.Control>
                                                <Checkbox.Indicator />
                                            </Checkbox.Control>
                                            <Checkbox.Content>
                                                <Label className="capitalize">{role}</Label>
                                            </Checkbox.Content>
                                        </Checkbox>
                                    ))}
                                    <div className="ms-auto flex gap-2">
                                        {!user.last_signed_in_at && !user.disabled_at && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onPress={() =>
                                                    router.post(`/admin/users/${user.id}/invite`, {}, { preserveScroll: true })
                                                }
                                            >
                                                Re-send invite
                                            </Button>
                                        )}
                                        {user.disabled_at ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onPress={() =>
                                                    router.post(`/admin/users/${user.id}/enable`, {}, { preserveScroll: true })
                                                }
                                            >
                                                Re-enable
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onPress={() =>
                                                    router.post(`/admin/users/${user.id}/disable`, {}, { preserveScroll: true })
                                                }
                                            >
                                                Disable
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card.Content>
                        </Card>
                    </li>
                ))}
            </ul>
        </main>
    );
}

function Status({ user }: { user: AdminUser }) {
    if (user.disabled_at) {
        return <Chip color="danger">Disabled</Chip>;
    }
    if (!user.last_signed_in_at) {
        return <Chip color="warning">Invited</Chip>;
    }
    return <Chip color="success">Active</Chip>;
}
