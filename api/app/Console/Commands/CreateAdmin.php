<?php

namespace App\Console\Commands;

use App\Mail\Invitation;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {email}';

    protected $description = 'Create an admin and email them an invite';

    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));

        $validator = Validator::make(['email' => $email], ['email' => ['required', 'email', 'unique:users,email']]);
        if ($validator->fails()) {
            $this->error($validator->errors()->first('email'));

            return self::FAILURE;
        }

        $admin = User::create(['email' => $email]);
        $admin->assignRole('admin', 'golfer');
        Mail::to($admin)->send(new Invitation);

        $this->info("Created admin {$email} and sent their invite.");

        return self::SUCCESS;
    }
}
