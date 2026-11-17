<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A golfer gives a fallback Handicap Index before anything else, so Games always
 * have a starting Level.
 */
class EnsureGolferSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->hasRole('golfer') && ! Setting::exists()) {
            return redirect('/settings/handicap');
        }

        return $next($request);
    }
}
