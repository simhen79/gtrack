<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmailCodeController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    public function send(Request $request): RedirectResponse
    {
        $email = strtolower(trim($request->validate(['email' => ['required', 'email']])['email']));

        // Counted whether or not the email is invited, so the limit reveals nothing.
        $limits = ["login-code:email:{$email}" => 3, "login-code:ip:{$request->ip()}" => 10];
        foreach ($limits as $key => $max) {
            if (RateLimiter::tooManyAttempts($key, $max)) {
                $minutes = (int) ceil(RateLimiter::availableIn($key) / 60);
                throw ValidationException::withMessages(['email' => "Too many codes requested. Try again in {$minutes} minutes."]);
            }
        }
        foreach (array_keys($limits) as $key) {
            RateLimiter::hit($key, 15 * 60);
        }

        User::where('email', $email)->whereNull('disabled_at')->first()?->sendOneTimePassword();

        // Kept until sign-in, not flashed, so a wrong code can come back to this page.
        $request->session()->put('login.email', $email);

        return to_route('login.code');
    }

    public function show(Request $request): Response|RedirectResponse
    {
        $email = $request->session()->get('login.email');
        if (! $email) {
            return to_route('login');
        }

        return Inertia::render('auth/code', ['email' => $email]);
    }

    public function verify(Request $request): RedirectResponse
    {
        $input = $request->validate(['email' => ['required', 'email'], 'code' => ['required', 'string']]);
        $user = User::where('email', strtolower(trim($input['email'])))->whereNull('disabled_at')->first();

        if (! $user?->consumeOneTimePassword($input['code'])->isOk()) {
            throw ValidationException::withMessages(['code' => 'That code didn\'t work. Check the latest email, or ask for a new code.']);
        }

        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->forget('login.email');
        $user->forceFill(['last_signed_in_at' => now()])->save();

        return redirect()->intended('/');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('login');
    }
}
