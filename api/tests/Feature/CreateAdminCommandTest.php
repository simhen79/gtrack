<?php

use App\Mail\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

beforeEach(fn () => Mail::fake());

it('creates the first admin and invites them', function () {
    $this->artisan('app:create-admin', ['email' => 'Owner@Example.com'])
        ->expectsOutputToContain('owner@example.com')
        ->assertSuccessful();

    $admin = User::where('email', 'owner@example.com')->sole();
    expect($admin->hasRole('admin'))->toBeTrue();
    Mail::assertSent(Invitation::class, fn (Invitation $mail) => $mail->hasTo('owner@example.com'));
});

it('refuses an email that already has a user', function () {
    User::factory()->create(['email' => 'owner@example.com']);

    $this->artisan('app:create-admin', ['email' => 'owner@example.com'])->assertFailed();

    Mail::assertNothingSent();
});

it('refuses something that is not an email', function () {
    $this->artisan('app:create-admin', ['email' => 'not-an-email'])->assertFailed();

    expect(User::count())->toBe(0);
});
