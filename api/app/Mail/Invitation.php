<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class Invitation extends Mailable
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You\'re invited to '.config('app.name'));
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.invitation', with: ['signInUrl' => config('app.url').'/login']);
    }
}
