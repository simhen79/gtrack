<?php

namespace App\Auth;

use App\Models\User;

/**
 * Whose data golfer-owned models read and write. Set per request by the
 * SetCurrentGolfer middleware, and by each job from its golfer id.
 */
class CurrentGolfer
{
    private ?string $id = null;

    public function set(User $golfer): void
    {
        $this->id = $golfer->id;
    }

    public function clear(): void
    {
        $this->id = null;
    }

    /**
     * @throws NoCurrentGolfer
     */
    public function id(): string
    {
        return $this->id ?? throw new NoCurrentGolfer;
    }
}
