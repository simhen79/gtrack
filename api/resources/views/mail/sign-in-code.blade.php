<x-mail::message>
# Your sign-in code

Enter this code where you asked for it to sign in to {{ config('app.name') }}.

<x-mail::code>
{{ $code }}
</x-mail::code>

<p class="code-note muted">It lasts {{ $minutes }} minutes and works once. Asking for another code replaces this one.</p>

<p>Signing in somewhere else? Go to <a href="{{ $signInUrl }}">{{ $signInUrl }}</a>.</p>

<p class="muted">If you didn't ask for a code, ignore this email: nobody can sign in without it. Never share it.</p>
</x-mail::message>
