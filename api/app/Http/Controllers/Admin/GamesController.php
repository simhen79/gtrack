<?php

namespace App\Http\Controllers\Admin;

use App\Enums\GameStatus;
use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\RedirectResponse;

class GamesController extends Controller
{
    /**
     * Takes the Game out of the Catalogue. Its versions stay, so scores against them
     * survive.
     */
    public function retire(Game $game): RedirectResponse
    {
        $version = $game->versions()->status(GameStatus::Published)->firstOrFail();
        $version->forceFill(['status' => GameStatus::Retired, 'retired_at' => now()])->save();
        $this->toast('Game retired', $version->name);

        return to_route('admin.catalogue', ['item' => $version->id]);
    }
}
