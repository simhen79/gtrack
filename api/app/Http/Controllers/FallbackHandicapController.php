<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Handicap Index Games start from before the golfer has entered a Round.
 */
class FallbackHandicapController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/handicap', [
            'fallback_handicap_index' => Setting::value('fallback_handicap_index'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'fallback_handicap_index' => ['required', 'decimal:0,1', 'between:-10,54'],
        ]);

        Setting::firstOrNew()->fill($validated)->save();

        return redirect('/');
    }
}
