<?php

use App\Data\MeData;
use App\Http\Controllers\Api\CatalogueController;
use App\Http\Controllers\Api\EmailCodeController;
use App\Http\Controllers\Api\PracticeGroundsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login/code', [EmailCodeController::class, 'send']);
Route::post('/login', [EmailCodeController::class, 'verify'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', fn (Request $request) => MeData::fromUser($request->user()));
    Route::post('/logout', [EmailCodeController::class, 'destroy']);
    Route::get('/catalogue', [CatalogueController::class, 'index'])->middleware('can:catalogue.read');
    Route::apiResource('practice-grounds', PracticeGroundsController::class)->except('destroy')->names('api.practice-grounds');
    Route::post('/practice-grounds/{practice_ground}/archive', [PracticeGroundsController::class, 'archive']);
    Route::post('/practice-grounds/{practice_ground}/restore', [PracticeGroundsController::class, 'restore']);
});
