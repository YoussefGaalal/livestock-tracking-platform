<?php

namespace App\Console\Commands;

use App\Models\Auction;
use Illuminate\Console\Command;

class EndExpiredAuctions extends Command
{
    protected $signature = 'auctions:end-expired';
    protected $description = 'End all expired auctions that have not been manually ended';

    public function handle(): int
    {
        $expiredAuctions = Auction::where('status', 'active')
            ->where('ends_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($expiredAuctions as $auction) {
            $highestBid = $auction->highestBid();

            if ($highestBid) {
                $sold = $auction->reserve_price 
                    ? $highestBid->amount >= $auction->reserve_price 
                    : true;

                if ($sold) {
                    $secondHighest = $auction->secondHighestBid();
                    
                    $auction->update([
                        'status' => 'sold',
                        'winner_id' => $highestBid->user_id,
                        'second_winner_id' => $secondHighest?->user_id,
                        'ended_at' => now(),
                        'payment_expires_at' => now()->addHours(24),
                        'payment_status' => 'pending',
                    ]);
                    
                    $this->info("Auction #{$auction->id} sold to user #{$highestBid->user_id}");
                } else {
                    $auction->update([
                        'status' => 'ended',
                        'ended_at' => now(),
                    ]);
                    
                    $this->info("Auction #{$auction->id} ended (reserve not met)");
                }
            } else {
                $auction->update([
                    'status' => 'ended',
                    'ended_at' => now(),
                ]);
                
                $this->info("Auction #{$auction->id} ended (no bids)");
            }

            $count++;
        }

        $this->info("Processed {$count} expired auctions");
        return Command::SUCCESS;
    }
}
