import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';
import { applySgKey, signSg, type SgKey } from '../lib/strokes-gained';

const KEYS: SgKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '±', '0', '.'];

type Props = {
    value: string;
    onChange: (value: string) => void;
    /** Moves to the next SG Category, or closes the keypad after Putting. */
    onNext: () => void;
    isLast: boolean;
};

/**
 * One keypad for every Strokes Gained value: a ± key because phone decimal
 * keypads have no minus, and Next to move through the four SG Categories.
 * A physical keyboard works too.
 *
 * The first key replaces the value already in the box, so fixing a number never
 * needs deleting first. Give it a `key` per SG Category so each starts fresh.
 */
export function SgKeypad({ value, onChange, onNext, isLast }: Props) {
    const [fresh, setFresh] = useState(true);
    const press = (key: SgKey) => {
        onChange(applySgKey(fresh ? '' : value, key));
        setFresh(false);
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }
            if (event.key === '-' || event.key === '+') {
                event.preventDefault();
                onChange(signSg(fresh ? '' : value, event.key));
                setFresh(false);
                return;
            }
            const key = /^[0-9.]$/.test(event.key) ? (event.key as SgKey) : event.key === 'Backspace' ? '⌫' : null;

            if (key) {
                event.preventDefault();
                press(key);
            } else if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                onNext();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

    return (
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Strokes Gained keypad">
            {KEYS.map((key, index) => (
                <Button
                    key={key}
                    variant="secondary"
                    className="h-14 w-full text-xl font-semibold"
                    style={{ gridColumnStart: (index % 3) + 1, gridRowStart: Math.floor(index / 3) + 1 }}
                    onPress={() => press(key)}
                >
                    {key}
                </Button>
            ))}
            <Button
                variant="secondary"
                aria-label="Delete"
                className="h-14 w-full text-xl"
                style={{ gridColumnStart: 4, gridRowStart: 1 }}
                onPress={() => press('⌫')}
            >
                ⌫
            </Button>
            <Button className="h-auto w-full text-lg font-semibold" style={{ gridColumnStart: 4, gridRowStart: 2, gridRowEnd: 5 }} onPress={onNext}>
                {isLast ? 'Done' : 'Next'}
            </Button>
        </div>
    );
}
