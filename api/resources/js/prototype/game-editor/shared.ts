/** PROTOTYPE ONLY (#25). Moves to the first field with a problem, as a refused save does on the real forms. */
export function focusFirstProblem() {
    const first = document.querySelector<HTMLElement>(
        'main [aria-invalid="true"], main [data-has-error]',
    );
    const target = first?.matches("input, button, textarea")
        ? first
        : (first
              ?.closest("section")
              ?.querySelector<HTMLElement>("input, button, textarea") ?? first);
    target?.scrollIntoView({ block: "center" });
    target?.focus({ preventScroll: true });
}
