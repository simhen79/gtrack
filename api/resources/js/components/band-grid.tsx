import type { SgBandData } from '@gtrack/types';
import { SignedInput } from './sg-input';

type Props = {
    bands: SgBandData[];
    /** Strokes Gained as typed, by SG band id. */
    values: Record<string, string>;
    onChange: (bandId: string, value: string) => void;
    errors: Partial<Record<string, string>>;
    className?: string;
};

/** Strokes Gained for one SG Category, entered by distance band. A blank band counts as 0. */
export function BandGrid({ bands, values, onChange, errors, className = '' }: Props) {
    return (
        <div className={`grid gap-2 ${className}`}>
            {bands.map((band) => (
                <div key={band.id} className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-muted">{band.label}</span>
                    <SignedInput
                        label={`Strokes Gained from ${band.label}`}
                        value={values[band.id] ?? ''}
                        onChange={(value) => onChange(band.id, value)}
                        invalid={`bands.${band.id}` in errors}
                        placeholder="0.00"
                        className="h-10"
                        inputClassName="text-[14px]"
                    />
                </div>
            ))}
        </div>
    );
}
