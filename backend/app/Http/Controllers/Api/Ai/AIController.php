<?php

namespace App\Http\Controllers\Api\Ai;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class AIController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'model' => 'nullable|string',
        ]);

        $message = $request->input('message');
        $model = $request->input('model', 'gemini-2.0-flash');

        $settings = DB::table('settings')->where('key', 'like', 'gemini_%')->pluck('value', 'key')->toArray();
        $apiKey = $settings['gemini_api_key'] ?? null;
        $enabled = filter_var($settings['gemini_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$enabled || !$apiKey) {
            return response()->json([
                'error' => 'AI assistant is not configured. Please enable Gemini AI in settings.',
            ], 400);
        }

        $user = $request->user();
        $userContext = $this->getUserContext($user);

        $prompt = $this->buildPrompt($message, $userContext);

        try {
            $response = Http::timeout(120)->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.9,
                    'maxOutputTokens' => 2048,
                ],
            ]);

            if ($response->failed()) {
                return response()->json([
                    'error' => 'Failed to get AI response',
                    'details' => $response->json(),
                ], 500);
            }

            $data = $response->json();
            $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Sorry, I could not generate a response.';

            return response()->json([
                'reply' => $reply,
                'model' => $model,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'AI service error: ' . $e->getMessage(),
            ], 500);
        }
    }

    protected function getUserContext($user)
    {
        if (!$user) {
            return 'Guest user';
        }

        $animals = \App\Models\Animal::where('owner_id', $user->id)->count();
        $devices = \App\Models\Device::where('owner_id', $user->id)->count();

        return "User: {$user->name}, Role: " . $user->getPrimaryRoleName() . ", Animals: {$animals}, Devices: {$devices}";
    }

    protected function buildPrompt($message, $userContext)
    {
        return <<<EOT
You are an AI assistant for The Oasis livestock management system. 
You help users manage their camel herds, sheep, goats, and other livestock.

User Context: {$userContext}

Guidelines:
- Be concise and helpful
- Provide specific advice for livestock management
- If you don't know something, say so honestly
- Arabic is supported for responses

User message: {$message}

EOT;
    }

    public function status(Request $request)
    {
        $settings = DB::table('settings')->where('key', 'like', 'gemini_%')->pluck('value', 'key')->toArray();
        $enabled = filter_var($settings['gemini_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $hasKey = !empty($settings['gemini_api_key']);

        return response()->json([
            'available' => $enabled && $hasKey,
            'enabled' => $enabled,
            'hasKey' => $hasKey,
            'model' => $settings['gemini_model'] ?? 'gemini-2.0-flash',
        ]);
    }
}