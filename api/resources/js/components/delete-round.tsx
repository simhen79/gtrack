import { AlertDialog, Button } from '@heroui/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type Props = {
    round: { id: string; course_name: string; played_on: string };
    fullWidth?: boolean;
};

/** Delete Round, confirmed in the design system's AlertDialog rather than the browser's own confirm. */
export function DeleteRound({ round, fullWidth = false }: Props) {
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const played = new Date(`${round.played_on}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

    const destroy = () =>
        router.delete(`/rounds/${round.id}`, {
            onStart: () => setDeleting(true),
            onFinish: () => setDeleting(false),
        });

    return (
        <AlertDialog isOpen={open} onOpenChange={setOpen}>
            <Button variant="danger-soft" fullWidth={fullWidth}>
                Delete Round
            </Button>
            <AlertDialog.Backdrop>
                <AlertDialog.Container>
                    <AlertDialog.Dialog className="sm:max-w-[420px]">
                        <AlertDialog.Header className="flex-row items-center justify-between gap-3">
                            <AlertDialog.Heading>Delete this Round?</AlertDialog.Heading>
                            <AlertDialog.Icon status="danger" />
                        </AlertDialog.Header>
                        <AlertDialog.Body>
                            <p className="text-muted">
                                <span className="font-bold text-foreground">{round.course_name}</span> on {played}, with its advanced stats and
                                distance bands, will be gone from your Rounds and trends. It can’t be undone.
                            </p>
                        </AlertDialog.Body>
                        <AlertDialog.Footer>
                            <Button slot="close" variant="tertiary">
                                Keep Round
                            </Button>
                            <Button variant="danger" isPending={deleting} onPress={destroy}>
                                Delete Round
                            </Button>
                        </AlertDialog.Footer>
                    </AlertDialog.Dialog>
                </AlertDialog.Container>
            </AlertDialog.Backdrop>
        </AlertDialog>
    );
}
