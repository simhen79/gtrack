<?php

use App\Http\Middleware\EnsureGolferSettings;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetCurrentGolfer;
use App\Http\Middleware\SignOutDisabledUsers;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            SignOutDisabledUsers::class,
            SetCurrentGolfer::class,
            HandleInertiaRequests::class,
        ]);

        $middleware->api(append: [SetCurrentGolfer::class]);

        $middleware->alias(['golfer.settings' => EnsureGolferSettings::class]);

        // Before `auth`, which Laravel's priority list would otherwise run first.
        $middleware->prependToPriorityList(before: AuthenticatesRequests::class, prepend: SignOutDisabledUsers::class);

        // After `auth` sets the user and before route model binding, which queries golfer-owned rows.
        $middleware->prependToPriorityList(before: SubstituteBindings::class, prepend: SetCurrentGolfer::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
