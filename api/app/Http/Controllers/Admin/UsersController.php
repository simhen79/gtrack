<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\Invitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/users', [
            'users' => User::with('roles')->orderBy('email')->get()->map(fn (User $user) => [
                'id' => $user->id,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->sort()->values()->all(),
                'last_signed_in_at' => $user->last_signed_in_at?->toIso8601String(),
                'disabled_at' => $user->disabled_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $email = $request->validate(['email' => ['required', 'email', 'unique:users,email']])['email'];

        $user = User::create(['email' => $email])->assignRole('golfer');
        Mail::to($user)->send(new Invitation);

        return to_route('admin.users.index');
    }

    public function resendInvite(User $user): RedirectResponse
    {
        if ($user->last_signed_in_at) {
            throw ValidationException::withMessages(['invite' => 'This invite has been used: they have already signed in.']);
        }

        Mail::to($user)->send(new Invitation);

        return to_route('admin.users.index');
    }

    public function updateRoles(Request $request, User $user): RedirectResponse
    {
        $roles = $request->validate([
            'roles' => ['present', 'array'],
            'roles.*' => [Rule::in(['admin', 'golfer'])],
        ])['roles'];

        if (! in_array('admin', $roles) && $this->isLastAdmin($user)) {
            throw ValidationException::withMessages(['roles' => 'This is the last admin, so the admin role stays.']);
        }

        $user->syncRoles($roles);

        return to_route('admin.users.index');
    }

    /**
     * Ends every web session at once and keeps the user's data.
     */
    public function disable(User $user): RedirectResponse
    {
        if ($this->isLastAdmin($user)) {
            throw ValidationException::withMessages(['disable' => 'This is the last admin, so their login can\'t be disabled.']);
        }

        DB::transaction(function () use ($user) {
            $user->forceFill(['disabled_at' => now()])->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        });

        return to_route('admin.users.index');
    }

    public function enable(User $user): RedirectResponse
    {
        $user->forceFill(['disabled_at' => null])->save();

        return to_route('admin.users.index');
    }

    private function isLastAdmin(User $user): bool
    {
        return $user->hasRole('admin')
            && $user->disabled_at === null
            && User::role('admin')->whereNull('disabled_at')->count() === 1;
    }
}
