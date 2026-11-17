<?php

use App\Data\MeData;
use App\Http\Controllers\Api\EmailCodeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login/code', [EmailCodeController::class, 'send']);
Route::post('/login', [EmailCodeController::class, 'verify'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', fn (Request $request) => MeData::fromUser($request->user()));
    Route::post('/logout', [EmailCodeController::class, 'destroy']);
});
