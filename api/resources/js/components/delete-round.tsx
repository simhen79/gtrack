import { router } from '@inertiajs/react';
import { ConfirmDialog, ConfirmName } from './confirm-dialog';

type Props = {
    round: { id: string; course_name: string; played_on: string };
    fullWidth?: boolean;
};

/** Delete Round, asked first in the shared ConfirmDialog. */
export function DeleteRound({ round, fullWidth = false }: Props) {
    const played = new Date(`${round.played_on}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <ConfirmDialog
            trigger="Delete Round"
            fullWidth={fullWidth}
            heading="Delete this Round?"
            keep="Keep Round"
            onConfirm={(visit) => router.delete(`/rounds/${round.id}`, visit)}
        >
            <ConfirmName>{round.course_name}</ConfirmName> on {played}, with its advanced stats and distance bands, will be gone from your
            Rounds and trends. It can’t be undone.
        </ConfirmDialog>
    );
}
