<?php

namespace App\Http\Middleware;

use App\Auth\CurrentGolfer;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentGolfer
{
    public function handle(Request $request, Closure $next): Response
    {
        $currentGolfer = app(CurrentGolfer::class);

        if ($request->user()) {
            $currentGolfer->set($request->user());
        }

        try {
            return $next($request);
        } finally {
            $currentGolfer->clear();
        }
    }
}
