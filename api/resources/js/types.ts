import type { AuthData, ToastData } from '@gtrack/types';

/** Props every Inertia page receives. `errors` comes from Inertia itself. */
export type SharedProps = {
    auth: AuthData;
    errors: Record<string, string>;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        /** What a controller flashes to the page its redirect lands on. */
        flashDataType: { toast?: ToastData };
    }
}
