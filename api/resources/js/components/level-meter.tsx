import { Meter } from '@heroui/react';

/** A Game's Level as five pips beside "Level N", read out as "Level N of 5". Never pips alone. */
export function LevelMeter({ level }: { level: number }) {
    return (
        <Meter value={level} minValue={1} maxValue={5} aria-label="Level" valueLabel={`Level ${level} of 5`} className="flex items-center gap-3">
            <span aria-hidden className="flex gap-1">
                {[1, 2, 3, 4, 5].map((pip) => (
                    <span key={pip} className={`h-2 w-4 rounded-[4px] ${pip <= level ? 'bg-highlight' : 'bg-surface-tertiary'}`} />
                ))}
            </span>
            <b className="text-[14px] whitespace-nowrap">Level {level}</b>
        </Meter>
    );
}
