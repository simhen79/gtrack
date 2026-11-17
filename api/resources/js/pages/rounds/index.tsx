import { Card, Link } from '@heroui/react';
import type { RoundSummaryData } from '@gtrack/types';
import { Head } from '@inertiajs/react';
import { formatSg } from '../../lib/strokes-gained';

export default function Rounds({ rounds }: { rounds: RoundSummaryData[] }) {
    return (
        <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
            <Head title="Rounds" />
            <Link href="/">Home</Link>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Rounds</h1>
                <Link href="/rounds/create" className="font-semibold">
                    Enter a Round
                </Link>
            </div>

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
                                            {formatSg(round.sg_total)}
                                        </span>
                                    </Card.Content>
                                </Card>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
