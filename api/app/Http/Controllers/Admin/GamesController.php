<?php

namespace App\Http\Controllers\Admin;

use App\Catalogue\Publisher;
use App\Data\DistanceGroupData;
use App\Data\FacilityData;
use App\Data\GameVersionData;
use App\Enums\GameStatus;
use App\Enums\SgCategory;
use App\Http\Controllers\Controller;
use App\Http\Requests\GameRequest;
use App\Models\Game;
use App\Models\GameVersion;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GamesController extends Controller
{
    public function create(): Response
    {
        return $this->editor(null);
    }

    public function store(GameRequest $request, Publisher $publisher): RedirectResponse
    {
        $version = $publisher->publishNew($request->validated());
        $this->toast('Game published', "{$version->name}, v{$version->version}");

        return to_route('admin.catalogue', ['item' => $version->id]);
    }

    /** Opens a Game's published version, or its Draft when it has none yet. */
    public function edit(Game $game): Response
    {
        return $this->editor($game->editableVersion()->with(GameVersionData::WITH)->firstOrFail());
    }

    /**
     * Saves a published Game in place, or publishes it as a new version when a field
     * that changes the Game changed. A Draft is saved and published.
     */
    public function update(GameRequest $request, Game $game, Publisher $publisher): RedirectResponse
    {
        $before = $game->editableVersion()->firstOrFail();
        $version = $publisher->save($game, $request->validated());
        $before->is($version) && $before->status === GameStatus::Published
            ? $this->toast('Game saved', "{$version->name}, v{$version->version}")
            : $this->toast('Game published', "{$version->name}, v{$version->version}");

        return to_route('admin.catalogue', ['item' => $version->id]);
    }

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

    private function editor(?GameVersion $version): Response
    {
        return Inertia::render('admin/game', [
            'game' => $version ? GameVersionData::fromVersion($version) : null,
            // Versions this one replaced, newest first: their scores stay labelled with them.
            'earlier_versions' => $version
                ? GameVersion::with(GameVersionData::WITH)
                    ->where('game_id', $version->game_id)
                    ->where('version', '<', $version->version)
                    ->where('status', '!=', GameStatus::Draft)
                    ->orderByDesc('version')
                    ->get()
                    ->map(GameVersionData::fromVersion(...))
                : [],
            'facilities' => FacilityData::list(),
            'category_facilities' => SgCategory::facilityMap(),
            'distance_groups' => DistanceGroupData::list(),
        ]);
    }
}
