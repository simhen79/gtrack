<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['catalogue.read', 'catalogue.write', 'drafts.manage', 'users.manage', 'usage.read_all'] as $name) {
            Permission::create(['name' => $name]);
        }

        Role::create(['name' => 'golfer'])->givePermissionTo('catalogue.read');
        Role::create(['name' => 'admin'])->givePermissionTo([
            'catalogue.write', 'drafts.manage', 'users.manage', 'usage.read_all',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Role::whereIn('name', ['admin', 'golfer'])->delete();
        Permission::query()->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
