<?php

namespace App\Data;

use App\Enums\Role;
use App\Models\User;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** A row on the admin Users screen. */
#[TypeScript]
class AdminUserData extends Data
{
    /** @param list<Role> $roles */
    public function __construct(
        public string $id,
        public string $email,
        public array $roles,
        public ?string $last_signed_in_at,
        public ?string $disabled_at,
    ) {}

    public static function fromUser(User $user): self
    {
        return new self(
            $user->id,
            $user->email,
            $user->roles->pluck('name')->sort()->values()->map(fn (string $name) => Role::from($name))->all(),
            $user->last_signed_in_at?->toIso8601String(),
            $user->disabled_at?->toIso8601String(),
        );
    }
}
