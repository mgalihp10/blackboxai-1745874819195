<?php

namespace App\Http\Controllers\Session;

use Laravel\Lumen\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use App\Models\Session\Sessions;

class SessionController extends BaseController
{
    public function create(Request $request)
    {
        $sessionName = $request->input('sessionName');
        if (!$sessionName) {
            return response()->json(['error' => 'sessionName is required'], 400);
        }

        $session = Sessions::firstOrCreate(['session_name' => $sessionName]);
        return response()->json($session);
    }

    public function index()
    {
        $sessions = Sessions::all();
        return response()->json(['sessions' => $sessions]);
    }

    public function delete($id)
    {
        $session = Sessions::find($id);
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }
        $session->delete();
        return response()->json(['message' => 'Session deleted']);
    }
}
