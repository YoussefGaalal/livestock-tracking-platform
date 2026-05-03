<?php

namespace Database\Seeders;

use App\Models\Bid;
use App\Models\Auction;
use App\Models\User;
use Illuminate\Database\Seeder;

class BidSeeder extends Seeder
{
    public function run(): void
    {
        $auctions = Auction::where('status', 'active')->get();
        $users = User::where('role', 'Owner')->get();

        foreach ($auctions as $auction) {
            $numBids = rand(1, 3);
            
            for ($i = 0; $i < $numBids; $i++) {
                $bidder = $users->random();
                if ($bidder->id === $auction->owner_id) {
                    continue;
                }

                $increment = rand(500, 2000);
                $amount = ($i === 0) 
                    ? $auction->starting_price + $increment 
                    : $auction->current_price + $increment;

                Bid::create([
                    'auction_id' => $auction->id,
                    'user_id' => $bidder->id,
                    'amount' => $amount,
                    'bidder_name' => $bidder->name,
                    'bid_at' => now()->subHours(rand(1, 24 * $i + 1)),
                    'is_winning' => ($i === $numBids - 1),
                ]);

                $auction->update(['current_price' => $amount]);
            }
        }
    }
}
