<?php

use App\Models\User;
use App\Notifications\SignInCode;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => Notification::fake());

/** The code in the latest email sent to this user. */
function sentCode(User $user): string
{
    $code = null;
    Notification::assertSentTo($user, SignInCode::class, function ($notification) use (&$code) {
        $code = $notification->oneTimePassword->password;

        return true;
    });

    return $code;
}

it('emails an invited golfer a 6-digit code that signs them in', function () {
    $golfer = golfer();

    $this->post('/login/code', ['email' => $golfer->email])->assertRedirect('/login/code');
    $code = sentCode($golfer);
    expect($code)->toMatch('/^\d{6}$/');

    $this->post('/login', ['email' => $golfer->email, 'code' => $code])->assertRedirect('/');

    $this->assertAuthenticatedAs($golfer);
});

it('stores the code only as a hash', function () {
    $golfer = golfer();
    $this->post('/login/code', ['email' => $golfer->email]);

    $this->assertDatabaseHas('one_time_passwords', ['authenticatable_id' => $golfer->id]);
    $this->assertDatabaseMissing('one_time_passwords', ['password' => sentCode($golfer)]);
});

it('accepts a code only once', function () {
    $golfer = golfer();
    $this->post('/login/code', ['email' => $golfer->email]);
    $code = sentCode($golfer);
    $this->post('/login', ['email' => $golfer->email, 'code' => $code]);
    $this->post('/logout');

    $this->post('/login', ['email' => $golfer->email, 'code' => $code])->assertSessionHasErrors('code');

    $this->assertGuest();
});

it('accepts a code for 10 minutes', function (int $minutes, bool $works) {
    $golfer = golfer();
    $this->post('/login/code', ['email' => $golfer->email]);

    $this->travel($minutes)->minutes();
    $this->post('/login', ['email' => $golfer->email, 'code' => sentCode($golfer)]);

    expect(auth()->check())->toBe($works);
})->with([
    'after 9 minutes' => [9, true],
    'after 11 minutes' => [11, false],
]);

it('kills a code after 5 wrong tries', function () {
    $golfer = golfer();
    $this->post('/login/code', ['email' => $golfer->email]);
    $code = sentCode($golfer);
    $wrong = $code === '000000' ? '111111' : '000000';

    foreach (range(1, 5) as $_) {
        $this->post('/login', ['email' => $golfer->email, 'code' => $wrong])->assertSessionHasErrors('code');
    }
    $this->post('/login', ['email' => $golfer->email, 'code' => $code])->assertSessionHasErrors('code');

    $this->assertGuest();
});

it('still accepts the code after 4 wrong tries', function () {
    $golfer = golfer();
    $this->post('/login/code', ['email' => $golfer->email]);
    $code = sentCode($golfer);
    $wrong = $code === '000000' ? '111111' : '000000';

    foreach (range(1, 4) as $_) {
        $this->post('/login', ['email' => $golfer->email, 'code' => $wrong]);
    }
    $this->post('/login', ['email' => $golfer->email, 'code' => $code]);

    $this->assertAuthenticatedAs($golfer);
});

it('replaces the old code when a new one is requested', function () {
    $golfer = golfer();
    $this->post('/login/code', ['email' => $golfer->email]);
    $old = sentCode($golfer);
    $this->post('/login/code', ['email' => $golfer->email]);
    $new = sentCode($golfer);

    if ($old !== $new) {
        $this->post('/login', ['email' => $golfer->email, 'code' => $old])->assertSessionHasErrors('code');
    }
    $this->post('/login', ['email' => $golfer->email, 'code' => $new]);

    $this->assertAuthenticatedAs($golfer);
});

it('gives an uninvited email the same response and sends nothing', function () {
    $invited = $this->post('/login/code', ['email' => golfer()->email]);
    $uninvited = $this->post('/login/code', ['email' => 'stranger@example.com']);

    expect($uninvited->status())->toBe($invited->status())
        ->and($uninvited->headers->get('Location'))->toBe($invited->headers->get('Location'));
    $uninvited->assertSessionHas('login.email', 'stranger@example.com');
    Notification::assertCount(1);
});

it('sends nothing to a disabled login', function () {
    $golfer = User::factory()->disabled()->create();

    $this->post('/login/code', ['email' => $golfer->email])->assertRedirect('/login/code');

    Notification::assertNothingSent();
});

it('refuses a fourth code for one email within 15 minutes', function () {
    $golfer = golfer();
    foreach (range(1, 3) as $_) {
        $this->post('/login/code', ['email' => $golfer->email])->assertSessionHasNoErrors();
    }

    $this->post('/login/code', ['email' => $golfer->email])->assertSessionHasErrors('email');
    Notification::assertSentToTimes($golfer, SignInCode::class, 3);

    $this->travel(16)->minutes();
    $this->post('/login/code', ['email' => $golfer->email])->assertSessionHasNoErrors();
});

it('limits an uninvited email the same way', function () {
    foreach (range(1, 3) as $_) {
        $this->post('/login/code', ['email' => 'stranger@example.com']);
    }

    $this->post('/login/code', ['email' => 'stranger@example.com'])->assertSessionHasErrors('email');
});

it('refuses more than 10 code requests from one IP within 15 minutes', function () {
    foreach (range(1, 10) as $i) {
        $this->post('/login/code', ['email' => "person{$i}@example.com"])->assertSessionHasNoErrors();
    }

    $this->post('/login/code', ['email' => golfer()->email])->assertSessionHasErrors('email');
    Notification::assertNothingSent();
});

it('keeps the golfer on the code page with an error after a wrong code', function () {
    $golfer = golfer();
    $this->post('/login/code', ['email' => $golfer->email]);
    $this->get('/login/code');
    $wrong = sentCode($golfer) === '000000' ? '111111' : '000000';

    $this->from('/login/code')->post('/login', ['email' => $golfer->email, 'code' => $wrong])
        ->assertRedirect('/login/code');

    $this->get('/login/code')->assertInertia(fn (Assert $page) => $page
        ->component('auth/code')
        ->where('email', $golfer->email)
        ->where('errors.code', fn ($message) => filled($message)));
});

it('refuses more than 10 code entries from one IP within a minute', function () {
    foreach (range(1, 10) as $i) {
        $this->post('/login', ['email' => "person{$i}@example.com", 'code' => '000000'])->assertSessionHasErrors('code');
    }

    $this->post('/login', ['email' => 'person11@example.com', 'code' => '000000'])->assertTooManyRequests();
});
