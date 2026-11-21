import type { ToastStatus } from '@gtrack/types';
import { Check, Xmark } from '@gravity-ui/icons';
import { Toast, toast } from '@heroui/react';
import type { Method } from '@inertiajs/core';
import { router } from '@inertiajs/react';

const TIMEOUT = 5000;

/**
 * Raises Toasts from requests: the one a controller flashes after a completed action, and a
 * `danger` one when a request fails for a reason no field can fix. A failed request leaves the
 * page as it was, so nothing typed is lost. Called once, before the first page, so a flash on
 * that page shows too.
 */
export function raiseToastsFromRequests() {
    // Neither failure event names its visit, so the Toast reads the method from the latest one.
    let method: Method = 'get';
    router.on('start', (event) => {
        method = event.detail.visit.method;
    });

    router.on('flash', (event) => {
        const flashed = event.detail.flash.toast;
        if (flashed) {
            show(flashed.status, flashed.title, flashed.description);
        }
    });

    router.on('httpException', (event) => {
        const { status, headers } = event.detail.response;
        // An Inertia page that came back with an error status renders as usual.
        if (headers['x-inertia']) {
            return;
        }
        show('danger', failed(method), failure(status));
        // Keeps the page and its form; development still opens Laravel's error page for a 5xx.
        if (!(import.meta.env.DEV && status >= 500)) {
            event.preventDefault();
        }
    });

    router.on('networkError', (event) => {
        show('danger', failed(method), 'Check your connection and try again.');
        event.preventDefault();
    });
}

/** The one Toast region: bottom-centre, above the tab bar at phone width. */
export function Toasts() {
    return (
        <Toast.Provider placement="bottom" width={420} className="bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-6">
            {({ toast: queued }) => {
                const { variant, title, description } = queued.content;
                return (
                    <Toast
                        toast={queued}
                        placement="bottom"
                        variant={variant}
                        className="items-center gap-x-3 rounded-[18px] bg-overlay py-3 ps-4 pe-3 [box-shadow:var(--overlay-shadow)]"
                    >
                        <Toast.Indicator
                            variant={variant}
                            className={`size-7 rounded-full p-0 ${
                                variant === 'danger' ? 'bg-danger text-danger-foreground' : 'bg-success text-success-foreground'
                            }`}
                        >
                            {variant === 'danger' ? <Xmark className="size-3.5" /> : <Check className="size-3.5" />}
                        </Toast.Indicator>
                        <Toast.Content>
                            <Toast.Title className="text-[15px] font-bold text-overlay-foreground">{title}</Toast.Title>
                            {description && <Toast.Description className="text-[13px] font-medium text-muted">{description}</Toast.Description>}
                        </Toast.Content>
                        <Toast.CloseButton aria-label="Dismiss" />
                    </Toast>
                );
            }}
        </Toast.Provider>
    );
}

function show(status: ToastStatus, title: string, description: string | null) {
    toast(title, { variant: status, description: description ?? undefined, timeout: TIMEOUT });
}

/** What didn't happen, by the method of the visit that failed. */
function failed(method: Method): string {
    if (method === 'get' || method === 'query') {
        return "Couldn't load the page";
    }
    return method === 'delete' ? "Couldn't delete it" : "Couldn't save your changes";
}

/** Why, and what to do, by the status of a response that isn't an Inertia page. */
function failure(status: number): string {
    if (status === 419) {
        return 'Your session has expired. Sign in again in a new tab, then try again here.';
    }
    if (status === 429) {
        return 'Too many tries. Wait a minute, then try again.';
    }
    if (status >= 500) {
        return 'Something went wrong on our side. Try again in a moment.';
    }
    return 'Reload the page and try again.';
}
