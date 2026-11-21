import { useEffect, useState } from 'react';

/**
 * A refused save has no summary banner: each field's message sits under it, and the form moves to
 * the first field that needs fixing. Pass the returned callback as the Inertia visit's `onError`.
 * The effect runs once the refusal's errors are on the page, so it finds their fields.
 */
export function useFocusFirstError(): () => void {
    const [refusals, setRefusals] = useState(0);

    useEffect(() => {
        if (refusals > 0) {
            focusFirstError();
        }
    }, [refusals]);

    return () => setRefusals((count) => count + 1);
}

/**
 * The first field in the page's form that needs fixing, scrolled to the middle of the screen (clear of
 * the sticky save bar) and focused, so its message is read out. Fields mark themselves with
 * aria-invalid; anything else that holds an error (a group of ticks, a keypad row) with data-has-error.
 */
function focusFirstError() {
    const first = document.querySelector<HTMLElement>('main form [aria-invalid="true"], main form [data-has-error]');
    // A NumberField marks its group, not its input, and a group of ticks has no focus of its own,
    // so focus the control inside it.
    const target = first?.matches('input, button, textarea') ? first : (first?.querySelector<HTMLElement>('input, button, textarea') ?? first);
    target?.scrollIntoView({ block: 'center' });
    target?.focus({ preventScroll: true });
}
