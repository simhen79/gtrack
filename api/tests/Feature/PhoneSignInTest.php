<?php

use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

it('signs a golfer in with an emailed code and shows who they are', function () {
    $golfer = golfer();

    $token = phoneToken($golfer);

    fromPhone($token)->getJson('/api/me')
        ->assertOk()
        ->assertExactJson([
            'id' => $golfer->id,
            'email' => $golfer->email,
            'name' => $golfer->name,
            'permissions' => ['catalogue.read'],
        ]);
});

it('rejects a token last used more than 90 days ago', function () {
    $token = phoneToken(golfer());

    $this->travel(90 * 24 * 60 - 1)->minutes();
    fromPhone($token)->getJson('/api/me')->assertOk();

    $this->travel(90 * 24 * 60 + 1)->minutes();
    fromPhone($token)->getJson('/api/me')->assertUnauthorized();
});

it('signs a golfer out of the phone once an admin disables them', function () {
    $golfer = golfer();
    $token = phoneToken($golfer);

    $this->actingAs(admin())->post("/admin/users/{$golfer->id}/disable")->assertRedirect();

    fromPhone($token)->getJson('/api/me')->assertUnauthorized();
});

it('deletes idle tokens on the daily schedule and keeps recent ones', function () {
    $this->travelTo('2026-01-01 03:00:00');
    $idle = golfer();
    phoneToken($idle);

    $this->travelTo('2026-03-31 12:00:00');
    $recent = golfer();
    phoneToken($recent);

    $this->travelTo('2026-04-02 00:00:00');
    $this->artisan('schedule:run')->assertSuccessful();

    expect($idle->tokens()->count())->toBe(0)
        ->and($recent->tokens()->count())->toBe(1);
});

it('stops accepting a token once the phone signs out', function () {
    $token = phoneToken(golfer());

    fromPhone($token)->postJson('/api/logout')->assertNoContent();

    fromPhone($token)->getJson('/api/me')->assertUnauthorized();
});

it('gives no token for a wrong code', function () {
    $golfer = golfer();
    $this->postJson('/api/login/code', ['email' => $golfer->email]);

    $this->postJson('/api/login', ['email' => $golfer->email, 'code' => '000000', 'device_name' => 'iPhone'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('code')
        ->assertJsonMissingPath('token');
});

it('answers an uninvited email the same way but sends nothing', function () {
    $this->postJson('/api/login/code', ['email' => 'stranger@example.com'])->assertNoContent();

    Notification::assertNothingSent();
});
