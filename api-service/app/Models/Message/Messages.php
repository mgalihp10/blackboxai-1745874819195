<?php

namespace App\Models\Message;

use Illuminate\Database\Eloquent\Model;

class Messages extends Model
{
    protected $table = 'messages';

    protected $fillable = ['session_id', 'chat_id', 'message_id', 'to', 'message', 'is_reply'];
}
