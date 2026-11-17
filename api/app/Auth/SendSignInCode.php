<?php

namespace App\Auth;

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * Emails a sign-in code, for web and phone alike. Limited to 3 per email and 10
 * per IP every 15 minutes.
 */
class SendSignInCode
{
    /** @return string the normalised email */
    public function __invoke(string $email, ?string $ip): string
    {
        $email = strtolower(trim($email));

        // Counted whether or not the email is invited, so the limit reveals nothing.
        $limits = ["login-code:email:{$email}" => 3, "login-code:ip:{$ip}" => 10];
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

        return $email;
    }
}
