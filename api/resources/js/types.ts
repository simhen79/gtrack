import type { AuthData } from '@gtrack/types';

/** Props every Inertia page receives. `errors` comes from Inertia itself. */
export type SharedProps = {
    auth: AuthData;
    errors: Record<string, string>;
};
