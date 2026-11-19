import { Card, Link } from '@heroui/react';
import type { RoundSummaryData } from '@gtrack/types';
import { Head } from '@inertiajs/react';
import type { ShellProps } from '../../layouts/app-shell';
import { displaySg } from '../../lib/strokes-gained';

export default function Rounds({ rounds }: { rounds: RoundSummaryData[] }) {
    return (
        <div className="flex max-w-md flex-col gap-4">
            <Head title="Rounds" />

            {rounds.length === 0 ? (
                <p className="text-muted">No Rounds yet. Enter your first to see where you lose strokes.</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {rounds.map((round) => (
                        <li key={round.id}>
                            <Link href={`/rounds/${round.id}/edit`} className="block w-full no-underline">
                                <Card>
                                    <Card.Content className="flex flex-row items-center justify-between gap-3">
                                        <div className="text-sm">
                                            <p className="font-medium">{round.course_name}</p>
                                            <p className="text-muted">
                                                {new Date(`${round.played_on}T00:00`).toLocaleDateString()} ·{' '}
                                                {round.holes} holes · {round.score} · {round.baseline}
                                            </p>
                                        </div>
                                        <span className="text-xl font-semibold tabular-nums">
                                            {displaySg(round.sg_total)}
                                        </span>
                                    </Card.Content>
                                </Card>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

Rounds.layout = { title: 'Rounds' } satisfies ShellProps;
