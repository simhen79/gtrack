<x-mail::message>
# You're invited

You've been invited to {{ config('app.name') }}. There's no password: sign in with this email address and we'll send you a 6-digit code.

<x-mail::button :url="$signInUrl">
Sign in
</x-mail::button>

{{ config('app.name') }}
</x-mail::message>
