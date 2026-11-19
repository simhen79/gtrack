<?php

namespace App\Http\Controllers\Admin;

use App\Catalogue\Publisher;
use App\Enums\GameStatus;
use App\Http\Controllers\Controller;
use App\Models\GameVersion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class DraftsController extends Controller
{
    public function approve(string $draft, Publisher $publisher): RedirectResponse
    {
        $version = $this->draft($draft);
        $publisher->approve($version);

        return to_route('admin.catalogue', ['item' => $version->id]);
    }

    /**
     * Drafts are the only part of the Catalogue that's ever deleted. A new Game goes
     * with its only Draft.
     */
    public function destroy(string $draft): RedirectResponse
    {
        $version = $this->draft($draft);

        DB::transaction(function () use ($version) {
            $version->delete();

            if (! $version->game->versions()->exists()) {
                $version->game->delete();
            }
        });

        return to_route('admin.catalogue');
    }

    private function draft(string $id): GameVersion
    {
        return GameVersion::status(GameStatus::Draft)->findOrFail($id);
    }
}
