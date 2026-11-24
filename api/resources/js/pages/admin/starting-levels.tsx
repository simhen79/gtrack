import { Button, Card, FieldError, Form, Input, NumberField, TextField } from '@heroui/react';
import type { StartingLevelData } from '@gtrack/types';
import { Head, useForm } from '@inertiajs/react';
import { AdminTabs } from '../../components/admin-tabs';
import { LevelMeter } from '../../components/level-meter';
import type { ShellProps } from '../../layouts/app-shell';
import { useFocusFirstError } from '../../lib/forms';

type Props = { bands: StartingLevelData[] };

/** One tenth below a Handicap Index, for the end of the band before it: 3.0 ends the band 0.0–2.9. */
const below = (from: string) => (Number(from) - 0.1).toFixed(1);

/**
 * The Handicap Index bands that set the Level a golfer starts a Game at. Each band runs from its
 * Handicap Index to the next one's; the first holds everything below the second.
 */
export default function StartingLevels({ bands }: Props) {
    const form = useForm<{ bands: StartingLevelData[] }>({ bands });
    const errors = form.errors as Record<string, string | undefined>;
    const onError = useFocusFirstError();
    const rows = form.data.bands;

    const setBand = (index: number, change: Partial<StartingLevelData>) =>
        form.setData(
            'bands',
            rows.map((band, other) => (other === index ? { ...band, ...change } : band)),
        );

    const range = (index: number) => {
        const next = rows[index + 1]?.from;
        if (index === 0) {
            return next ? `below ${next}` : 'any';
        }
        const from = rows[index].from ?? '';
        if (!next) {
            return `${from} and above`;
        }
        // Until the bands climb, there's no range to show.
        return Number(next) > Number(from) ? `${from}–${below(next)}` : '–';
    };

    return (
        <div className="flex flex-col gap-4">
            <Head title="Starting Levels" />
            <AdminTabs />

            <Form
                validationBehavior="aria"
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put('/admin/starting-levels', { onError, preserveScroll: true });
                }}
            >
                <div className="sticky top-0 z-20 -mt-2 bg-(--background) pt-2 md:-mt-4 md:pt-4">
                    <div className="flex gap-2 rounded-[24px] bg-surface p-3 [box-shadow:var(--overlay-shadow)]">
                        <Button type="submit" size="lg" className="flex-1 sm:flex-none" isPending={form.processing}>
                            Save starting Levels
                        </Button>
                    </div>
                </div>

                <Card>
                    <Card.Header>
                        <Card.Title>Handicap Index bands</Card.Title>
                        <Card.Description>
                            A golfer starts each new Game at the Level for their Handicap Index, from their latest Round or else their settings.
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div className="overflow-x-auto">
                            <table className="border-separate border-spacing-y-1.5 text-[14px]">
                                <thead>
                                    <tr className="text-left text-[13px] text-muted">
                                        <th className="px-3 font-medium">From Handicap Index</th>
                                        <th className="hidden px-3 font-medium sm:table-cell">Band</th>
                                        <th className="px-3 font-medium">Starting Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((band, index) => (
                                        <tr
                                            key={index}
                                            className="bg-surface-secondary align-top [&>td:first-child]:rounded-s-[14px] [&>td:last-child]:rounded-e-[14px]"
                                        >
                                            <td className="w-32 px-3 py-2 sm:w-40">
                                                {index === 0 ? (
                                                    <span className="block py-2 text-muted">Below the next band</span>
                                                ) : (
                                                    <TextField
                                                        aria-label={`Band ${index + 1} from Handicap Index`}
                                                        inputMode="decimal"
                                                        isInvalid={`bands.${index}.from` in errors}
                                                        value={band.from ?? ''}
                                                        onChange={(value) => setBand(index, { from: value === '' ? null : value })}
                                                    >
                                                        <Input className="w-24 text-right tabular-nums sm:w-full" />
                                                        <FieldError>{errors[`bands.${index}.from`]}</FieldError>
                                                    </TextField>
                                                )}
                                            </td>
                                            <td className="hidden px-3 py-2 sm:table-cell">
                                                <span className="block py-2 whitespace-nowrap tabular-nums">{range(index)}</span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-4">
                                                    <NumberField
                                                        aria-label={`Starting Level for band ${index + 1}`}
                                                        minValue={1}
                                                        maxValue={5}
                                                        step={1}
                                                        isInvalid={`bands.${index}.level` in errors}
                                                        value={band.level}
                                                        onChange={(value) => setBand(index, { level: Number.isNaN(value) ? band.level : value })}
                                                        className="w-24"
                                                    >
                                                        <NumberField.Group>
                                                            <NumberField.Input className="text-right tabular-nums" />
                                                        </NumberField.Group>
                                                        <FieldError>{errors[`bands.${index}.level`]}</FieldError>
                                                    </NumberField>
                                                    <span className="hidden py-2 sm:block">
                                                        <LevelMeter level={Math.min(5, Math.max(1, band.level))} />
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card.Content>
                </Card>
            </Form>
        </div>
    );
}

StartingLevels.layout = { title: 'Starting Levels' } satisfies ShellProps;
