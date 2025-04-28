<?php

namespace App\Models\Session;

use Illuminate\Database\Eloquent\Model;

class Sessions extends Model
{
    protected $table = 'sessions';

    protected $fillable = ['session_name', 'session_data', 'status'];
}
