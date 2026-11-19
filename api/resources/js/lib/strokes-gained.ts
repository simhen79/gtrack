import { formatSG, parseSG } from '@gtrack/design';

/** A key on the Strokes Gained keypad. */
export type SgKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '±' | '⌫';

/**
 * Applies one keypad key to a Strokes Gained value as typed, holding it to two
 * decimals and at most two whole digits (the server accepts ±99.99).
 */
export function applySgKey(value: string, key: SgKey): string {
    const negative = value.startsWith('-');
    const digits = negative ? value.slice(1) : value;
    const sign = negative ? '-' : '';

    if (key === '±') {
        return negative ? digits : `-${digits}`;
    }
    if (key === '⌫') {
        return value.slice(0, -1);
    }
    if (key === '.') {
        return digits.includes('.') ? value : `${sign}${digits || '0'}.`;
    }

    const [whole, decimals] = digits.split('.');
    if (decimals !== undefined) {
        return decimals.length >= 2 ? value : value + key;
    }
    if (whole === '0') {
        return sign + key;
    }
    return whole.length >= 2 ? value : value + key;
}

/** A typed or stored value through the shared formatSG ("+1.05", "−0.40"), or an em dash when empty. */
export function displaySg(value: string | null | undefined): string {
    const number = value ? parseSG(value) : null;
    return number === null ? '—' : formatSG(number);
}

/** Adds values in hundredths, so float rounding never shows. A value still being typed, such as "−", counts as 0. */
export function sumSg(values: (string | null)[]): string {
    const hundredths = values.reduce((total, value) => total + Math.round((parseSG(value ?? '') ?? 0) * 100), 0);
    return (hundredths / 100).toFixed(2);
}

/** A Strokes Gained value typed into a text field: the new text if it's still a valid value as typed, else the old. */
export function typeSg(previous: string, typed: string): string {
    const value = typed.replace('−', '-').replace('+', '');
    return /^-?\d{0,2}(\.\d{0,2})?$/.test(value) ? value : previous;
}

/** Flips a value's sign, for the ± button and for typing + or −. */
export function flipSg(value: string): string {
    return value.startsWith('-') ? value.slice(1) : `-${value}`;
}
