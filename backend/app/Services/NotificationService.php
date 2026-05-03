<?php

namespace App\Services;

use App\Models\GeofenceAlert;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected string $fromNumber;

    public function __construct()
    {
        $this->apiUrl = env('TWILIO_API_URL', 'https://api.twilio.com/2010-04-01');
    }

    protected function getSetting(string $key, $default = null)
    {
        $setting = DB::table('settings')->where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    protected function getTwilioSettings(): array
    {
        return [
            'account_sid' => $this->getSetting('twilio_account_sid') ?? env('TWILIO_ACCOUNT_SID'),
            'auth_token' => $this->getSetting('twilio_auth_token') ?? env('TWILIO_AUTH_TOKEN'),
            'phone_number' => $this->getSetting('twilio_phone_number') ?? env('SMS_FROM_NUMBER'),
            'enabled' => filter_var($this->getSetting('twilio_enabled') ?? env('SMS_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    protected function getWhatsAppSettings(): array
    {
        return [
            'api_url' => $this->getSetting('whatsapp_api_url') ?? env('WHATSAPP_API_URL'),
            'api_token' => $this->getSetting('whatsapp_api_token') ?? env('WHATSAPP_API_TOKEN'),
            'phone_number_id' => $this->getSetting('whatsapp_phone_number_id') ?? env('WHATSAPP_PHONE_NUMBER_ID'),
            'enabled' => filter_var($this->getSetting('whatsapp_enabled') ?? env('WHATSAPP_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    public function sendGeofenceAlert(GeofenceAlert $alert): array
    {
        $animal = $alert->animal;
        $geofence = $alert->geofence;
        
        if (!$animal || !$geofence) {
            return ['success' => false, 'message' => 'Missing animal or geofence data'];
        }

        $owner = $animal->owner;
        if (!$owner || !$owner->phone) {
            return ['success' => false, 'message' => 'Owner has no phone number'];
        }

        $action = $alert->type === 'entry' ? 'entered' : 'exited';
        $message = "🐪 Oasis Alert: {$animal->animal_id} has {$action} {$geofence->name} at " . now()->format('H:i');

        $results = [];

        if ($this->isSmsEnabled()) {
            $results['sms'] = $this->sendSms($owner->phone, $message);
        }

        if ($this->isCallEnabled()) {
            $results['call'] = $this->makeCall($owner->phone, $message);
        }

        if ($this->isWhatsAppEnabled()) {
            $results['whatsapp'] = $this->sendWhatsApp($owner->phone, $message);
        }

        $alert->update([
            'notification_sent' => true,
            'notification_sent_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'Notifications sent',
            'details' => $results,
        ];
    }

    public function sendSms(string $to, string $message): array
    {
        if (!$this->isSmsEnabled()) {
            return ['success' => false, 'message' => 'SMS not configured'];
        }

        try {
            $settings = $this->getTwilioSettings();
            $sid = $settings['account_sid'];
            $token = $settings['auth_token'];
            $from = $settings['phone_number'];
            
            if ($sid && $token && $from && $from !== $to) {
                $response = Http::withBasicAuth($sid, $token)
                    ->asForm()
                    ->post("{$this->apiUrl}/Accounts/{$sid}/Messages.json", [
                        'From' => $from,
                        'To' => $to,
                        'Body' => $message,
                    ]);

                if ($response->successful()) {
                    return [
                        'success' => true,
                        'message' => 'SMS sent successfully',
                        'sid' => $response->json('sid'),
                    ];
                }

                $errorMsg = $response->json('message') ?? 'SMS failed';
                return [
                    'success' => false,
                    'message' => $errorMsg,
                ];
            }

            Log::info("SMS notification: To {$to}: {$message}");
            return [
                'success' => true,
                'message' => 'SMS notification logged',
                'logged' => true,
            ];
        } catch (\Exception $e) {
            Log::error("SMS error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    public function sendWhatsApp(string $to, string $message): array
    {
        if (!$this->isWhatsAppEnabled()) {
            return ['success' => false, 'message' => 'WhatsApp not configured'];
        }

        try {
            $settings = $this->getWhatsAppSettings();
            $apiUrl = $settings['api_url'];
            $token = $settings['api_token'];
            $phoneId = $settings['phone_number_id'];
            
            if ($apiUrl && $token && $phoneId) {
                $formattedTo = str_replace('+', '', $to);
                
                $response = Http::withToken($token)
                    ->post("{$apiUrl}/{$phoneId}/messages", [
                        'messaging_product' => 'whatsapp',
                        'to' => $formattedTo,
                        'type' => 'text',
                        'text' => [
                            'body' => $message,
                        ],
                    ]);

                if ($response->successful()) {
                    return [
                        'success' => true,
                        'message' => 'WhatsApp message sent successfully',
                        'id' => $response->json('messages.0.id'),
                    ];
                }

                $errorMsg = $response->json('error.message') ?? 'WhatsApp message failed';
                return [
                    'success' => false,
                    'message' => $errorMsg,
                ];
            }

            Log::info("WhatsApp notification: To {$to}: {$message}");
            return [
                'success' => true,
                'message' => 'WhatsApp notification logged',
                'logged' => true,
            ];
        } catch (\Exception $e) {
            Log::error("WhatsApp error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    public function makeCall(string $to, string $message): array
    {
        if (!$this->isCallEnabled()) {
            return ['success' => false, 'message' => 'Calls not configured'];
        }

        try {
            $settings = $this->getTwilioSettings();
            $sid = $settings['account_sid'];
            $token = $settings['auth_token'];
            $from = $settings['phone_number'];
            
            if ($sid && $token && $from && $from !== $to) {
                $twiml = "<Response><Say voice=\"alice\">{$message}</Say></Response>";

                $response = Http::withBasicAuth($sid, $token)
                    ->withHeaders(['Content-Type' => 'application/x-www-form-urlencoded'])
                    ->asForm()
                    ->post("{$this->apiUrl}/Accounts/{$sid}/Calls.json", [
                        'From' => $from,
                        'To' => $to,
                        'Twiml' => $twiml,
                    ]);

                if ($response->successful()) {
                    return [
                        'success' => true,
                        'message' => 'Call initiated successfully',
                        'sid' => $response->json('sid'),
                    ];
                }

                $errorMsg = $response->json('message') ?? 'Call failed';
                return [
                    'success' => false,
                    'message' => $errorMsg,
                ];
            }

            Log::info("Call notification: To {$to}: {$message}");
            return [
                'success' => true,
                'message' => 'Call notification logged',
                'logged' => true,
            ];
        } catch (\Exception $e) {
            Log::error("Call error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    protected function isSmsEnabled(): bool
    {
        return filter_var($this->getSetting('twilio_enabled') ?? env('SMS_ENABLED', false), FILTER_VALIDATE_BOOLEAN);
    }

    protected function isCallEnabled(): bool
    {
        return filter_var($this->getSetting('twilio_enabled') ?? env('CALL_ENABLED', false), FILTER_VALIDATE_BOOLEAN);
    }

    protected function isWhatsAppEnabled(): bool
    {
        return filter_var($this->getSetting('whatsapp_enabled') ?? env('WHATSAPP_ENABLED', false), FILTER_VALIDATE_BOOLEAN);
    }
}
