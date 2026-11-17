<?php

namespace App\Providers;

use App\Auth\CurrentGolfer;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Spatie\LaravelTypeScriptTransformer\TypeScriptTransformerApplicationServiceProvider as BaseTypeScriptTransformerServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(CurrentGolfer::class);

        // The transformer is a dev dependency, so production doesn't have it.
        if (class_exists(BaseTypeScriptTransformerServiceProvider::class)) {
            $this->app->register(TypeScriptTransformerServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Phone tokens never expire outright, but one left unused for 90 days stops working.
        Sanctum::authenticateAccessTokensUsing(
            fn (PersonalAccessToken $token, bool $isValid) => $isValid
                && ($token->last_used_at ?? $token->created_at)->gte(now()->subDays(config('sanctum.idle_days'))),
        );
    }
}
