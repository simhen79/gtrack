<x-mail::message>
# You're invited

You've been invited to {{ config('app.name') }}, to log your Rounds with Strokes Gained and get Practice Sessions that adapt to you.

There's no password. Sign in with this email address and we'll email you a 6-digit code.

<x-mail::button :url="$signInUrl">
Sign in to {{ config('app.name') }}
</x-mail::button>

{{-- For clients that hide the button's address. The text button already prints it. --}}
<x-mail::html-only>
<p class="muted">Or go to {{ $signInUrl }}</p>
</x-mail::html-only>
</x-mail::message>
