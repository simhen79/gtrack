<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Spatie\OneTimePasswords\Notifications\OneTimePasswordNotification;

/** The sign-in code email, in the gtrack mail theme. Its subject leads with the code so an inbox list shows it. */
class SignInCode extends OneTimePasswordNotification
{
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->subject())
            ->markdown('mail.sign-in-code', [
                'code' => $this->oneTimePassword->password,
                'minutes' => config('one-time-passwords.default_expires_in_minutes'),
                'signInUrl' => config('app.url').'/login',
            ]);
    }

    public function subject(): string
    {
        return "{$this->oneTimePassword->password} is your ".config('app.name').' sign-in code';
    }
}
