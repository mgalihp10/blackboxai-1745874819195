<?php

namespace App\Http\Controllers\Message;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use App\Models\Message\Messages;

class MessageController extends BaseController
{
    public function send(Request $request)
    {
        $sessionId = $request->input('session_id');
        $to = $request->input('to');
        $message = $request->input('message');

        if (!$sessionId || !$to || !$message) {
            return response()->json(['error' => 'session_id, to, and message are required'], 400);
        }

        $msg = Messages::create([
            'session_id' => $sessionId,
            'to' => $to,
            'message' => $message,
        ]);

        return response()->json($msg);
    }

    public function reply(Request $request)
    {
        $sessionId = $request->input('session_id');
        $chatId = $request->input('chat_id');
        $messageId = $request->input('message_id');
        $message = $request->input('message');

        if (!$sessionId || !$chatId || !$messageId || !$message) {
            return response()->json(['error' => 'session_id, chat_id, message_id, and message are required'], 400);
        }

        $msg = Messages::create([
            'session_id' => $sessionId,
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'message' => $message,
            'is_reply' => true,
        ]);

        return response()->json($msg);
    }

    public function getMessages($sessionId, $chatId)
    {
        $messages = Messages::where('session_id', $sessionId)->get();
        return response()->json($messages);
    }
}
