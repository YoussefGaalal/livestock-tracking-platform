<?php

namespace App\Console\Commands;

use App\Models\Animal;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Device;
use App\Models\Geofence;
use App\Models\GeofenceAlert;
use App\Models\User;
use Illuminate\Console\Command;

class DataHealthCommand extends Command
{
    protected $signature = 'data:health {--json : Output as JSON}';
    protected $description = 'Check data health and integrity';

    public function handle(): int
    {
        $health = $this->collectHealthMetrics();

        if ($this->option('json')) {
            $this->line(json_encode($health, JSON_PRETTY_PRINT));
            return Command::SUCCESS;
        }

        $this->displayHealthReport($health);
        return Command::SUCCESS;
    }

    private function collectHealthMetrics(): array
    {
        $issues = [];
        $warnings = [];

        $animalCount = Animal::count();
        $deviceCount = Device::count();
        $userCount = User::count();
        $auctionCount = Auction::count();
        $geofenceCount = Geofence::count();
        $alertCount = GeofenceAlert::count();

        $devicesWithoutAnimals = Device::whereNull('animal_id')->count();
        if ($devicesWithoutAnimals > 0) {
            $warnings[] = "{$devicesWithoutAnimals} unassigned devices";
        }

        $animalsWithoutDevices = Animal::whereNull('device_id')->count();
        if ($animalsWithoutDevices > 0) {
            $warnings[] = "{$animalsWithoutDevices} animals without devices";
        }

        $animalsWithoutOwners = Animal::whereNull('owner_id')->count();
        if ($animalsWithoutOwners > 0) {
            $issues[] = "{$animalsWithoutOwners} animals without owners";
        }

        $devicesWithOrphanedLocations = \App\Models\LocationHistory::whereNotNull('device_id')
            ->whereNotIn('device_id', Device::pluck('id'))
            ->count();
        if ($devicesWithOrphanedLocations > 0) {
            $issues[] = "{$devicesWithOrphanedLocations} location history records with missing devices";
        }

        $alertsWithMissingRelations = GeofenceAlert::whereDoesntHave('animal')
            ->orWhereDoesntHave('geofence')
            ->count();
        if ($alertsWithMissingRelations > 0) {
            $warnings[] = "{$alertsWithMissingRelations} alerts with missing relations";
        }

        $auctionsWithEndedBids = Auction::where('status', 'ended')
            ->whereHas('bids')
            ->count();
        if ($auctionsWithEndedBids > 0) {
            $warnings[] = "{$auctionsWithEndedBids} ended auctions still have bids";
        }

        $orphanedBids = Bid::whereDoesntHave('auction')->count();
        if ($orphanedBids > 0) {
            $issues[] = "{$orphanedBids} bids without auctions";
        }

        $inactiveGeofences = Geofence::where('is_active', false)->count();
        $activeGeofences = Geofence::where('is_active', true)->count();

        $unacknowledgedAlerts = GeofenceAlert::where('is_acknowledged', false)->count();

        return [
            'timestamp' => now()->toIso8601String(),
            'summary' => [
                'total_animals' => $animalCount,
                'total_devices' => $deviceCount,
                'total_users' => $userCount,
                'total_auctions' => $auctionCount,
                'total_geofences' => $geofenceCount,
                'total_alerts' => $alertCount,
            ],
            'active_geofences' => $activeGeofences,
            'inactive_geofences' => $inactiveGeofences,
            'unacknowledged_alerts' => $unacknowledgedAlerts,
            'issues' => $issues,
            'warnings' => $warnings,
            'health_score' => $this->calculateHealthScore($issues, $warnings),
        ];
    }

    private function calculateHealthScore(array $issues, array $warnings): int
    {
        $score = 100;
        $score -= count($issues) * 15;
        $score -= count($warnings) * 5;
        return max(0, $score);
    }

    private function displayHealthReport(array $health): void
    {
        $this->newLine();
        $this->info('╔══════════════════════════════════════════════════════════════╗');
        $this->info('║                    DATA HEALTH REPORT                       ║');
        $this->info('╚══════════════════════════════════════════════════════════════╝');
        $this->newLine();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Animals', $health['summary']['total_animals']],
                ['Total Devices', $health['summary']['total_devices']],
                ['Total Users', $health['summary']['total_users']],
                ['Total Auctions', $health['summary']['total_auctions']],
                ['Total Geofences', $health['summary']['total_geofences']],
                ['Total Alerts', $health['summary']['total_alerts']],
            ]
        );

        $this->newLine();
        $this->table(
            ['Status', 'Count'],
            [
                ['Active Geofences', $health['active_geofences']],
                ['Inactive Geofences', $health['inactive_geofences']],
                ['Unacknowledged Alerts', $health['unacknowledged_alerts']],
            ]
        );

        if (!empty($health['issues'])) {
            $this->newLine();
            $this->error('ISSUES:');
            foreach ($health['issues'] as $issue) {
                $this->line("  • {$issue}");
            }
        }

        if (!empty($health['warnings'])) {
            $this->newLine();
            $this->warn('WARNINGS:');
            foreach ($health['warnings'] as $warning) {
                $this->line("  • {$warning}");
            }
        }

        $this->newLine();
        $score = $health['health_score'];
        $color = match(true) {
            $score >= 80 => 'info',
            $score >= 50 => 'warn',
            default => 'error',
        };
        $this->{$color}("Health Score: {$score}%");
        $this->newLine();
    }
}
