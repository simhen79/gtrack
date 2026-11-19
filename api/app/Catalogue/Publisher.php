<?php

namespace App\Catalogue;

use App\Enums\GameStatus;
use App\Models\GameVersion;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Approves Drafts into the Catalogue. Games without Levels only, for now: the full
 * publish check (five Levels or none, targets, placeholders) joins it here.
 */
class Publisher
{
    /**
     * @throws ValidationException when the Game already has a published version
     */
    public function approve(GameVersion $draft): void
    {
        DB::transaction(function () use ($draft) {
            try {
                $draft->forceFill(['status' => GameStatus::Published, 'published_at' => now()])->save();
            } catch (UniqueConstraintViolationException) {
                // The database allows one published version per Game.
                throw ValidationException::withMessages([
                    'approve' => 'This Game already has a published version. Retire it before approving this one.',
                ]);
            }

            $draft->variations()->create(['wording' => $draft->rules, 'is_plain' => true]);
        });
    }
}
