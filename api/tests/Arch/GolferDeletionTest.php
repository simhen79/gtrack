<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Delete my account deletes the user and lets the database cascade to everything
// they own (spec: Data model › Deleting). These read the real migrations from the
// test database's information_schema to keep that true as tables are added.
uses(TestCase::class, RefreshDatabase::class);

// Fail closed: a table with a user_id cascades from users unless it's listed here,
// with the reason and the code that deletes its rows.
$userIdWithoutCascade = [
    'sessions' => 'Laravel\'s table, with no foreign key to users. AccountController::destroy() deletes the golfer\'s sessions before the user.',
];

// Fail closed: a foreign key between two golfer-owned tables cascades unless it's
// listed here, with the reason and where deletion handles it in order.
$foreignKeysWithoutCascade = [
    'rounds.baseline_id' => 'Restricts, so a Baseline with Rounds can\'t be deleted. AccountController::destroy() deletes the golfer\'s Rounds before the user.',
    'settings.default_baseline_id' => 'Sets null: deleting a Baseline mustn\'t delete the Settings. It never holds deletion back, and Settings cascade from users.',
];

/** @return Collection<int, string> the tables with a user_id column: golfer-owned */
function tablesWithUserId(): Collection
{
    return DB::table('information_schema.columns')
        ->where('table_schema', DB::getDatabaseName())
        ->where('column_name', 'user_id')
        ->orderBy('table_name')
        ->pluck('table_name');
}

/** @return Collection<int, object{table: string, column: string, references: string, on_delete: string}> */
function foreignKeys(): Collection
{
    return DB::table('information_schema.key_column_usage as k')
        ->join('information_schema.referential_constraints as r', function ($join) {
            $join->on('r.constraint_schema', '=', 'k.constraint_schema')
                ->on('r.constraint_name', '=', 'k.constraint_name')
                ->on('r.table_name', '=', 'k.table_name');
        })
        ->where('k.table_schema', DB::getDatabaseName())
        ->whereNotNull('k.referenced_table_name')
        ->orderBy('k.table_name')
        ->orderBy('k.column_name')
        ->get(['k.table_name as table', 'k.column_name as column', 'k.referenced_table_name as references', 'r.delete_rule as on_delete']);
}

it('cascades every golfer-owned table from users', function () use ($userIdWithoutCascade) {
    $cascading = foreignKeys()
        ->filter(fn ($key) => $key->column === 'user_id' && $key->references === 'users' && $key->on_delete === 'CASCADE')
        ->pluck('table');

    $failures = tablesWithUserId()
        ->diff($cascading)
        ->reject(fn ($table) => array_key_exists($table, $userIdWithoutCascade))
        ->map(fn ($table) => "{$table}.user_id doesn't cascade from users: add cascadeOnDelete() to its foreign key, or list {$table} in \$userIdWithoutCascade with the reason and the code that deletes its rows.")
        ->values()
        ->all();

    expect($failures)->toBe([]);
});

it('cascades every foreign key between golfer-owned tables', function () use ($foreignKeysWithoutCascade) {
    $golferOwned = tablesWithUserId();

    $failures = foreignKeys()
        ->filter(fn ($key) => $golferOwned->contains($key->table) && $golferOwned->contains($key->references))
        ->reject(fn ($key) => $key->on_delete === 'CASCADE' || array_key_exists("{$key->table}.{$key->column}", $foreignKeysWithoutCascade))
        ->map(fn ($key) => "{$key->table}.{$key->column} → {$key->references} is ON DELETE {$key->on_delete}: add cascadeOnDelete(), or list {$key->table}.{$key->column} in \$foreignKeysWithoutCascade with the reason and where deletion handles it in order.")
        ->values()
        ->all();

    expect($failures)->toBe([]);
});
