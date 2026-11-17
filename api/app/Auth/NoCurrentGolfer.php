<?php

namespace App\Auth;

use LogicException;

class NoCurrentGolfer extends LogicException
{
    public function __construct()
    {
        parent::__construct('Golfer-owned data was used with no current golfer set.');
    }
}
