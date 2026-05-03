<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuctionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'starting_price' => (float) $this->starting_price,
            'current_price' => (float) ($this->current_price ?? $this->starting_price),
            'reserve_price' => $this->reserve_price ? (float) $this->reserve_price : null,
            'bid_count' => $this->when(isset($this->bid_count), $this->bid_count),
            'time_remaining' => $this->when(isset($this->time_remaining), $this->time_remaining),
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'ended_at' => $this->ended_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'animal' => $this->whenLoaded('animal', function () {
                if (!$this->animal) {
                    return null;
                }
                return [
                    'id' => $this->animal->id,
                    'animal_id' => $this->animal->animal_id,
                    'name' => $this->animal->name,
                    'species' => $this->animal->species,
                    'breed' => $this->animal->breed,
                    'gender' => $this->animal->gender,
                    'age' => $this->animal->date_of_birth ? now()->diffInYears($this->animal->date_of_birth) : null,
                    'identification_photo' => $this->animal->identification_photo,
                    'baseline_temperature' => $this->animal->baseline_temperature,
                ];
            }),
            'owner' => $this->whenLoaded('owner', function () {
                if (!$this->owner) {
                    return null;
                }
                return [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                ];
            }),
            'winner' => $this->whenLoaded('winner', function () {
                if (!$this->winner) {
                    return null;
                }
                return [
                    'id' => $this->winner->id,
                    'name' => $this->winner->name,
                    'email' => $this->winner->email,
                ];
            }),
            'secondWinner' => $this->whenLoaded('secondWinner', function () {
                if (!$this->secondWinner) {
                    return null;
                }
                return [
                    'id' => $this->secondWinner->id,
                    'name' => $this->secondWinner->name,
                    'email' => $this->secondWinner->email,
                ];
            }),
            'payment_proof_url' => $this->payment_proof_url,
            'payment_status' => $this->payment_status,
            'payment_expires_at' => $this->payment_expires_at?->toIso8601String(),
            'payment_verified_at' => $this->payment_verified_at?->toIso8601String(),
            'payment_notes' => $this->payment_notes,
            'payment_expired' => $this->paymentExpired(),
            'bids' => $this->whenLoaded('bids', function () {
                return BidResource::collection($this->bids);
            }),
        ];
    }
}
