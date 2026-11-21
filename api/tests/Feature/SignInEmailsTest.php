<?php

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Symfony\Component\Mime\Email;

// Real mail through the array transport, so each test reads the emails as an inbox would.
beforeEach(fn () => config(['app.url' => 'https://gtrack.test', 'mail.from.address' => 'sign-in@gtrack.test']));

/** @return list<Email> every email sent so far, oldest first */
function inbox(): array
{
    return app('mailer')->getSymfonyTransport()->messages()
        ->map(fn ($sent) => $sent->getOriginalMessage())
        ->values()
        ->all();
}

/** Invites an email the way an admin does, then requests a sign-in code for it. */
function inviteAndRequestCode(string $email): void
{
    test()->actingAs(admin())->post('/admin/users', ['email' => $email])->assertRedirect('/admin/users');
    auth()->logout();
    test()->post('/login/code', ['email' => $email])->assertRedirect('/login/code');
}

it('sends the invitation and the sign-in code in one gtrack mail theme, each with a plain-text part', function () {
    inviteAndRequestCode('new.golfer@example.com');

    $emails = inbox();
    expect($emails)->toHaveCount(2);
    foreach ($emails as $email) {
        expect($email->getHtmlBody())
            ->toContain('<meta name="color-scheme" content="light dark">')
            ->toContain('prefers-color-scheme: dark')
            ->toContain('Manrope')
            ->toContain('#EE7B47')
            ->toContain('#B4CB45')
            ->toContain('gtrack</span>')
            ->not->toContain('All rights reserved')
            ->and($email->getTextBody())->toContain('gtrack')
            ->and($email->getTextBody())->not->toContain('<');
    }
});

it('puts the code first in the sign-in code email, says it lasts 10 minutes and works once, and links the app', function () {
    inviteAndRequestCode('new.golfer@example.com');

    $email = inbox()[1];
    preg_match('/^(\d{6}) is your gtrack sign-in code$/', $email->getSubject(), $subject);
    expect($subject)->not->toBeEmpty();
    $code = $subject[1];

    expect($email->getHtmlBody())
        ->toMatch('/class="code"[^>]*>\s*'.$code.'\s*</')
        ->toContain('10 minutes')
        ->toContain('works once')
        ->toContain('href="https://gtrack.test/login"')
        ->not->toContain('localhost')
        ->and($email->getTextBody())
        ->toContain($code)
        ->toContain('10 minutes')
        ->toContain('https://gtrack.test/login')
        ->not->toContain('localhost');
});

it('links the invitation to the app\'s sign-in page', function () {
    inviteAndRequestCode('new.golfer@example.com');

    expect(inbox()[0]->getSubject())->toBe('You\'re invited to gtrack')
        ->and(inbox()[0]->getHtmlBody())->toContain('href="https://gtrack.test/login"')
        ->and(inbox()[0]->getTextBody())->toContain('https://gtrack.test/login');
});

it('sends from MAIL_FROM_ADDRESS as gtrack', function () {
    inviteAndRequestCode('new.golfer@example.com');

    foreach (inbox() as $email) {
        expect($email->getFrom()[0]->getAddress())->toBe('sign-in@gtrack.test')
            ->and($email->getFrom()[0]->getName())->toBe('gtrack');
    }
});

it('refuses to send mail in production from a placeholder address', function () {
    config(['mail.from.address' => 'hello@example.com']);
    app()->detectEnvironment(fn () => 'production');
    $golfer = golfer();

    $this->withoutExceptionHandling()->withoutMiddleware(ValidateCsrfToken::class);
    expect(fn () => $this->post('/login/code', ['email' => $golfer->email]))
        ->toThrow(RuntimeException::class, 'MAIL_FROM_ADDRESS');

    expect(inbox())->toBeEmpty();
});
