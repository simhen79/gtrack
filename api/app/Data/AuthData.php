<?php

namespace App\Data;

use App\Models\User;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** Who is signed in to the web app, shared with every Inertia page as `auth`. */
#[TypeScript]
class AuthData extends Data
{
    /** @param list<string> $permissions */
    public function __construct(
        public ?SignedInUserData $user,
        public array $permissions,
    ) {}

    public static function fromUser(?User $user): self
    {
        return new self(
            $user ? new SignedInUserData($user->id, $user->email) : null,
            $user?->getAllPermissions()->pluck('name')->values()->all() ?? [],
        );
    }
}
