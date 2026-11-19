<?php

namespace App\Http\Controllers;

use App\Models\Round;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Delete my account: the user and every row they own, for good.
 */
class AccountController extends Controller
{
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['confirm' => ['accepted']], ['confirm.accepted' => 'Confirm that you want to delete your account.']);
        $user = $request->user();

        DB::transaction(function () use ($user) {
            if ($user->isLastAdmin()) {
                throw ValidationException::withMessages(['account' => 'You\'re the last admin, so your account can\'t be deleted. Make someone else an admin first.']);
            }

            DB::table('sessions')->where('user_id', $user->id)->delete();
            $user->tokens()->delete();
            $user->oneTimePasswords()->delete();

            // A Round holds its Baseline back from the cascade, so Rounds go first.
            Round::query()->delete();

            // Golfer-owned tables cascade from the user; HasRoles detaches the roles.
            $user->delete();
        });

        // Not logout(), which would save a new remember token and so bring the user back.
        Auth::guard('web')->logoutCurrentDevice();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('login');
    }
}
