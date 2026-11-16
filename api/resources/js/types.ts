// Hand-written until 'Sign in on the phone' settles generated types (Wayfinder
// `next` or laravel-data). Keep in step with HandleInertiaRequests and the controllers.

export type SharedProps = {
    auth: {
        user: { id: string; email: string } | null;
        permissions: string[];
    };
    errors: Record<string, string>;
};

export type Role = 'admin' | 'golfer';

export type AdminUser = {
    id: string;
    email: string;
    roles: Role[];
    last_signed_in_at: string | null;
    disabled_at: string | null;
};
