<?php

namespace App\Http\Controllers\Chat;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use App\Models\Chat\Chats;

class ChatController extends BaseController
{
    public function getChats($sessionId)
    {
        $chats = Chats::where('session_id', $sessionId)->get();
        return response()->json($chats);
    }
}
