<?php

use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\Auth\EmailCodeController;
use App\Http\Controllers\FallbackHandicapController;
use App\Http\Controllers\RoundsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'golfer.settings'])->group(function () {
    Route::inertia('/', 'home');
    Route::resource('rounds', RoundsController::class)->except('show');
});

Route::middleware('auth')->group(function () {
    Route::get('/settings/handicap', [FallbackHandicapController::class, 'edit']);
    Route::post('/settings/handicap', [FallbackHandicapController::class, 'store']);
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [EmailCodeController::class, 'create'])->name('login');
    Route::post('/login/code', [EmailCodeController::class, 'send']);
    Route::get('/login/code', [EmailCodeController::class, 'show'])->name('login.code');
    Route::post('/login', [EmailCodeController::class, 'verify'])->middleware('throttle:10,1');
});

Route::post('/logout', [EmailCodeController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'golfer.settings', 'can:users.manage'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [UsersController::class, 'index'])->name('users.index');
    Route::post('/users', [UsersController::class, 'store'])->name('users.store');
    Route::post('/users/{user}/invite', [UsersController::class, 'resendInvite'])->name('users.invite');
    Route::put('/users/{user}/roles', [UsersController::class, 'updateRoles'])->name('users.roles');
    Route::post('/users/{user}/disable', [UsersController::class, 'disable'])->name('users.disable');
    Route::post('/users/{user}/enable', [UsersController::class, 'enable'])->name('users.enable');
});
