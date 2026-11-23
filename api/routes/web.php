<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin\CatalogueController;
use App\Http\Controllers\Admin\DraftsController;
use App\Http\Controllers\Admin\DrillsController;
use App\Http\Controllers\Admin\GamesController;
use App\Http\Controllers\Admin\StartingLevelsController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\Auth\EmailCodeController;
use App\Http\Controllers\FallbackHandicapController;
use App\Http\Controllers\PracticeGroundsController;
use App\Http\Controllers\RoundsController;
use App\Http\Controllers\TrendsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'golfer.settings'])->group(function () {
    Route::inertia('/', 'home');
    Route::inertia('/settings', 'settings/index');
    Route::resource('rounds', RoundsController::class)->except('show');
    Route::get('/trends', [TrendsController::class, 'index']);
    Route::resource('practice-grounds', PracticeGroundsController::class)->except('show', 'destroy');
    Route::post('/practice-grounds/{practice_ground}/archive', [PracticeGroundsController::class, 'archive'])->name('practice-grounds.archive');
    Route::post('/practice-grounds/{practice_ground}/restore', [PracticeGroundsController::class, 'restore'])->name('practice-grounds.restore');
});

Route::middleware('auth')->group(function () {
    Route::get('/settings/handicap', [FallbackHandicapController::class, 'edit']);
    Route::post('/settings/handicap', [FallbackHandicapController::class, 'store']);
    Route::delete('/settings/account', [AccountController::class, 'destroy']);
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

Route::middleware(['auth', 'golfer.settings', 'can:catalogue.write'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/catalogue', [CatalogueController::class, 'index'])->name('catalogue');
    Route::get('/drills/create', [DrillsController::class, 'create'])->name('drills.create');
    Route::post('/drills', [DrillsController::class, 'store'])->name('drills.store');
    Route::get('/drills/{drill}/edit', [DrillsController::class, 'edit'])->name('drills.edit');
    Route::put('/drills/{drill}', [DrillsController::class, 'update'])->name('drills.update');
    Route::post('/drills/{drill}/retire', [DrillsController::class, 'retire'])->name('drills.retire');
    Route::get('/games/create', [GamesController::class, 'create'])->name('games.create');
    Route::post('/games', [GamesController::class, 'store'])->name('games.store');
    Route::get('/games/{game}/edit', [GamesController::class, 'edit'])->name('games.edit');
    Route::put('/games/{game}', [GamesController::class, 'update'])->name('games.update');
    Route::post('/games/{game}/retire', [GamesController::class, 'retire'])->name('games.retire');
    Route::get('/starting-levels', [StartingLevelsController::class, 'edit'])->name('starting-levels');
    Route::put('/starting-levels', [StartingLevelsController::class, 'update'])->name('starting-levels.update');
});

Route::middleware(['auth', 'golfer.settings', 'can:drafts.manage'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('/drafts/{draft}/approve', [DraftsController::class, 'approve'])->name('drafts.approve');
    Route::delete('/drafts/{draft}', [DraftsController::class, 'destroy'])->name('drafts.destroy');
});
