import { parseSG, sgTone } from '@gtrack/design';
import { displaySg } from '../lib/strokes-gained';

/** A Strokes Gained number as the design system shows it: signed, two decimals, coloured by sign. */
export function SgValue({ value, className = '' }: { value: string | null | undefined; className?: string }) {
    const number = value ? parseSG(value) : null;

    return <span className={`font-extrabold tabular-nums ${number === null ? 'text-muted' : sgTone(number)} ${className}`}>{displaySg(value)}</span>;
}
