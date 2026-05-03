<?php

namespace Database\Seeders;

use App\Models\Auction;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuctionSeeder extends Seeder
{
    public function run(): void
    {
        $animals = Animal::take(5)->get();
        $users = User::where('role', 'Owner')->get();

        $auctions = [
            [
                'title' => 'Prime Majaheem Camel - OA-2026-0001',
                'description' => 'A well-bred Majaheem camel, perfect for breeding. Excellent lineage with proven fertility.',
                'starting_price' => 25000,
                'current_price' => 25000,
                'reserve_price' => 35000,
                'status' => 'active',
            ],
            [
                'title' => 'Wadhah Breeding Female - OA-2026-0002',
                'description' => 'Experienced breeding female with two successful pregnancies. Great mothering qualities.',
                'starting_price' => 30000,
                'current_price' => 32000,
                'reserve_price' => 40000,
                'status' => 'active',
            ],
            [
                'title' => 'Racing Suhail - OA-2026-0003',
                'description' => 'Young male camel with exceptional speed and stamina. Currently in training for upcoming season.',
                'starting_price' => 45000,
                'current_price' => 45000,
                'reserve_price' => null,
                'status' => 'active',
            ],
        ];

        foreach ($auctions as $index => $auctionData) {
            if (!isset($animals[$index])) break;
            
            $animal = $animals[$index];
            $owner = $users[$index % $users->count()];

            $auctionData['animal_id'] = $animal->id;
            $auctionData['owner_id'] = $owner->id;
            $auctionData['starts_at'] = now();
            $auctionData['ends_at'] = now()->addDays(rand(2, 7));

            Auction::updateOrCreate(
                ['animal_id' => $animal->id, 'title' => $auctionData['title']],
                $auctionData
            );
        }
    }
}
