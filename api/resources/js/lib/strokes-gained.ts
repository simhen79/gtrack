import { formatSG, parseSG } from '@gtrack/design';

/** A key on the Strokes Gained keypad. */
export type SgKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '±' | '⌫';

/**
 * Strokes Gained is negative unless the golfer says otherwise: the first digit typed
 * into an empty value starts it with a minus, and ± (or +) on an empty value makes it
 * a "+" waiting for digits. Values sent to the server go through `sgForServer`.
 */
function splitSign(value: string): [sign: '' | '-' | '+', digits: string] {
    return value.startsWith('-') || value.startsWith('+') ? [value[0] as '-' | '+', value.slice(1)] : ['', value];
}

/**
 * Applies one keypad key to a Strokes Gained value as typed, holding it to two
 * decimals and at most two whole digits (the server accepts ±99.99).
 */
export function applySgKey(value: string, key: SgKey): string {
    const [typedSign, digits] = splitSign(value);
    const sign = value === '' ? '-' : typedSign;

    if (key === '±') {
        return flipSg(value);
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
    if (whole === '' || whole === '0') {
        return sign + key;
    }
    return whole.length >= 2 ? value : value + key;
}

/** Sets a value's sign outright, for typing − or + on a keyboard. */
export function signSg(value: string, sign: '-' | '+'): string {
    return sign + splitSign(value)[1];
}

/** A value as the server takes it: no "+", and blank when no digits were typed. */
export function sgForServer(value: string): string {
    const [sign, digits] = splitSign(value);
    return /\d/.test(digits) ? (sign === '-' ? '-' : '') + digits : '';
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
    const value = typed.replace('−', '-');
    if (!/^[-+]?\d{0,2}(\.\d{0,2})?$/.test(value)) {
        return previous;
    }
    return previous === '' && /^[\d.]/.test(value) ? `-${value}` : value;
}

/** Flips a value's sign, for the ± button. An empty value counts as negative, so it flips to "+". */
export function flipSg(value: string): string {
    const [sign, digits] = splitSign(value);
    return value === '' || sign === '-' ? `+${digits}` : `-${digits}`;
}
