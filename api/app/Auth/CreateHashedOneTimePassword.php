<?php

namespace App\Auth;

use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\OneTimePasswords\Actions\CreateOneTimePasswordAction;
use Spatie\OneTimePasswords\Models\OneTimePassword;

/**
 * Stores only a hash of the code. The returned model carries the plain code in
 * memory, unsaved, so the notification sent straight after can email it.
 */
class CreateHashedOneTimePassword extends CreateOneTimePasswordAction
{
    protected function createNewOneTimePassword(?int $expiresInMinutes, Authenticatable $user, ?Request $request): OneTimePassword
    {
        $code = $this->passwordGenerator->generate();

        $oneTimePassword = $user->oneTimePasswords()->create([
            'password' => Hash::make($code),
            'expires_at' => Carbon::now()->addMinutes($expiresInMinutes ?? config('one-time-passwords.default_expires_in_minutes')),
        ]);

        $oneTimePassword->password = $code;
        $oneTimePassword->syncOriginal();

        return $oneTimePassword;
    }
}
