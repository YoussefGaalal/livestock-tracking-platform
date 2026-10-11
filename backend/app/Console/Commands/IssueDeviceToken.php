<?php

namespace App\Console\Commands;

use App\Models\Device;
use Illuminate\Console\Command;

class IssueDeviceToken extends Command
{
    protected $signature = 'devices:issue-token {device : Device ID (numeric id or device_id such as IOT-001-A)}';

    protected $description = 'Issue (or rotate) the ingestion token a GPS tracker uses to post locations';

    public function handle(): int
    {
        $key = $this->argument('device');
        $device = Device::where('device_id', $key)->orWhere('id', $key)->first();

        if (!$device) {
            $this->error("Device [{$key}] not found.");
            return self::FAILURE;
        }

        $token = $device->issueApiToken();

        $this->info("Token issued for {$device->device_id} (id {$device->id}). Store it on the tracker — it is not shown again:");
        $this->line($token);

        return self::SUCCESS;
    }
}
