<?php

namespace App\Models;

use App\Models\Concerns\BelongsToGolfer;
use Database\Factories\BaselineFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Baseline extends Model
{
    /** @use HasFactory<BaselineFactory> */
    use BelongsToGolfer, HasFactory, HasUuids;

    protected $fillable = ['name'];
}
