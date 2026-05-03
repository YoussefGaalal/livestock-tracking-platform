<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BidResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'auction_id' => $this->auction_id,
            'user_id' => $this->user_id,
            'amount' => (float) $this->amount,
            'bidder_name' => $this->bidder_name,
            'bid_at' => $this->bid_at?->toIso8601String(),
            'is_winning' => $this->is_winning,
            'user' => $this->whenLoaded('user', function () {
                if (!$this->user) {
                    return null;
                }
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
        ];
    }
}
