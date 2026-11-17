<?php

namespace App\Http\Controllers\Api;

use App\Auth\SendSignInCode;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/**
 * Email-code sign-in for the phone, which holds a Sanctum token instead of a session.
 */
class EmailCodeController extends Controller
{
    public function send(Request $request, SendSignInCode $sendSignInCode): Response
    {
        $sendSignInCode($request->validate(['email' => ['required', 'email']])['email'], $request->ip());

        return response()->noContent();
    }

    public function verify(Request $request): JsonResponse
    {
        $input = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:255'],
        ]);
        $user = User::where('email', strtolower(trim($input['email'])))->whereNull('disabled_at')->first();

        if (! $user?->consumeOneTimePassword($input['code'])->isOk()) {
            throw ValidationException::withMessages(['code' => 'That code didn\'t work. Check the latest email, or ask for a new code.']);
        }

        $user->forceFill(['last_signed_in_at' => now()])->save();

        return response()->json(['token' => $user->createToken($input['device_name'])->plainTextToken]);
    }

    public function destroy(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}
