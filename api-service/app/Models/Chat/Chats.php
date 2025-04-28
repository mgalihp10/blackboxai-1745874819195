<?php

namespace App\Models\Chat;

use Illuminate\Database\Eloquent\Model;

class Chats extends Model
{
    protected $table = 'chats';

    protected $fillable = ['session_id', 'chat_name'];
}
