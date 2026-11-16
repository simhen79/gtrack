<?php

namespace App\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Timebox;
use Spatie\OneTimePasswords\Actions\ConsumeOneTimePasswordAction;
use Spatie\OneTimePasswords\Enums\ConsumeOneTimePasswordResult;
use Spatie\OneTimePasswords\Events\OneTimePasswordSuccessfullyConsumed;

/**
 * Checks the code against its hash, and kills it after 5 tries. Each try is
 * counted before the check, so a correct 5th try still works. Only the latest
 * code exists: creating one deletes the old.
 */
class ConsumeHashedOneTimePassword extends ConsumeOneTimePasswordAction
{
    public const MAX_TRIES = 5;

    protected function consumeOneTimePassword(
        Authenticatable $user,
        string $password,
        Request $request,
        Timebox $timebox,
    ): ConsumeOneTimePasswordResult {
        $oneTimePassword = $user->oneTimePasswords()->latest('id')->first();

        if (! $oneTimePassword) {
            return $this->onFailedToValidate($user, ConsumeOneTimePasswordResult::NoOneTimePasswordsFound);
        }

        if ($oneTimePassword->isExpired()) {
            return $this->onFailedToValidate($user, ConsumeOneTimePasswordResult::OneTimePasswordExpired);
        }

        // Reserve this try atomically before checking, so parallel guesses can't
        // all read the same count and slip past the limit.
        $reserved = $user->oneTimePasswords()
            ->whereKey($oneTimePassword->getKey())
            ->where('failed_attempts', '<', self::MAX_TRIES)
            ->increment('failed_attempts');

        if (! $reserved || ! Hash::check($password, $oneTimePassword->password)) {
            $user->oneTimePasswords()
                ->whereKey($oneTimePassword->getKey())
                ->where('failed_attempts', '>=', self::MAX_TRIES)
                ->delete();

            return $this->onFailedToValidate($user, ConsumeOneTimePasswordResult::IncorrectOneTimePassword);
        }

        // Only the request that deletes the code wins, so it can't be used twice
        // by parallel requests.
        if (! $user->oneTimePasswords()->whereKey($oneTimePassword->getKey())->delete()) {
            return $this->onFailedToValidate($user, ConsumeOneTimePasswordResult::NoOneTimePasswordsFound);
        }

        event(new OneTimePasswordSuccessfullyConsumed($user, $oneTimePassword));
        $timebox->returnEarly();

        return ConsumeOneTimePasswordResult::Ok;
    }
}
