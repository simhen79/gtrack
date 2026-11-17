<?php

namespace App\Data;

use App\Models\User;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/** The signed-in user as the phone sees them, from `/api/me`. */
#[TypeScript]
class MeData extends Data
{
    /** @param list<string> $permissions */
    public function __construct(
        public string $id,
        public string $email,
        public ?string $name,
        public array $permissions,
    ) {}

    public static function fromUser(User $user): self
    {
        return new self($user->id, $user->email, $user->name, $user->getAllPermissions()->pluck('name')->values()->all());
    }
}
