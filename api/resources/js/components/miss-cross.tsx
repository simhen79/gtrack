import { Label, NumberField } from '@heroui/react';

export type MissSide = 'long' | 'short' | 'left' | 'right';

type Props = {
    value: Record<MissSide, number | null>;
    onChange: (side: MissSide, percent: number | null) => void;
    /** The server's refusal for each side, shown under the cross. */
    errors: Partial<Record<MissSide, string>>;
};

/** The Approach miss cross: the share of Approach misses long, short, left and right of the target. */
export function MissCross({ value, onChange, errors }: Props) {
    const messages = [...new Set(Object.values(errors))];
    const cell = (side: MissSide) => (
        <NumberField
            aria-label={`Approach misses ${side}, %`}
            step={1}
            value={value[side] ?? Number.NaN}
            onChange={(percent) => onChange(side, Number.isNaN(percent) ? null : percent)}
            isInvalid={side in errors}
            className="flex w-20 flex-col items-center gap-1"
        >
            <Label className="text-[11px] font-extrabold text-muted uppercase">{side}</Label>
            <NumberField.Group className="h-10">
                <NumberField.Input className="w-full text-center font-bold tabular-nums" placeholder="%" />
            </NumberField.Group>
        </NumberField>
    );

    return (
        <div className="flex flex-col gap-2">
            <div role="group" aria-label="Approach miss cross, % of misses" className="grid w-max grid-cols-3 items-center gap-2">
                <span />
                {cell('long')}
                <span />
                {cell('left')}
                <span aria-hidden className="mx-auto size-10 rounded-full border-2 border-highlight" />
                {cell('right')}
                <span />
                {cell('short')}
                <span />
            </div>
            {messages.map((message) => (
                <p key={message} className="max-w-64 text-sm text-danger">
                    {message}
                </p>
            ))}
        </div>
    );
}
