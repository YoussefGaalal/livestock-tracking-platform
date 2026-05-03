<?php

namespace App\Http\Controllers\Api\Business;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\AuctionResource;
use App\Http\Resources\BidResource;
use App\Http\Controllers\Traits\OwnableAuthorization;
use App\Http\Controllers\Controller;

class AuctionController extends Controller
{
    use OwnableAuthorization;
    
    private function canAccessAuction(Request $request, Auction $auction): bool
    {
        $userId = $this->getUserId($request);
        $userRole = $this->getUserRole($request);
        
        if ($userRole === 'Admin') {
            return true;
        }
        
        if ($auction->owner_id == $userId) {
            return true;
        }
        
        if ($userRole === 'Owner' && in_array($auction->status, ['active', 'ended'])) {
            return true;
        }
        
        if ($userRole === 'Manager') {
            $user = $this->getUser($request);
            if ($user && $user->managed_by) {
                return $auction->owner_id == $user->managed_by;
            }
        }
        
        return false;
    }
    
    private function filterByRole(Request $request, $query)
    {
        $userId = $this->getUserId($request);
        $userRole = $this->getUserRole($request);
        
        if ($userRole === 'Admin') {
            return $query;
        }
        
        if ($userRole === 'Owner') {
            return $query->where(function ($q) use ($userId) {
                $q->where('owner_id', $userId)
                  ->orWhereIn('status', ['active', 'ended']);
            });
        }
        
        if ($userRole === 'Manager') {
            $user = $this->getUser($request);
            if ($user && $user->managed_by) {
                return $query->where(function ($q) use ($user) {
                    $q->where('owner_id', $user->managed_by)
                      ->orWhereIn('status', ['active', 'ended']);
                });
            }
            return $query->where('id', 0);
        }
        
        // Shepherd/Doctor can see active auctions for bidding
        if (in_array($userRole, ['Shepherd', 'Doctor'])) {
            return $query->whereIn('status', ['active', 'ended']);
        }
        
        // Default: show user's own auctions
        return $query->where('owner_id', $userId);
    }
    
    private function canCreateAuctionForAnimal(Request $request, Animal $animal): bool
    {
        $userId = $this->getUserId($request);
        $userRole = $this->getUserRole($request);
        
        if ($userRole === 'Admin') {
            return true;
        }
        
        if ($userRole === 'Owner' && $animal->owner_id == $userId) {
            return true;
        }
        
        if ($userRole === 'Manager') {
            $user = $this->getUser($request);
            if ($user && $user->managed_by) {
                return $animal->owner_id == $user->managed_by;
            }
        }
        
        return false;
    }
    
    // Helper for authenticated users
    private function canCreateAuctionForAuthenticatedUser(User $user, Animal $animal): bool
    {
        $userRole = $user->role;
        
        if ($userRole === 'Admin') {
            return true;
        }
        
        if ($userRole === 'Owner' && $animal->owner_id == $user->id) {
            return true;
        }
        
        if ($userRole === 'Manager' && $user->managed_by) {
            return $animal->owner_id == $user->managed_by;
        }
        
        return false;
    }

    public function index(Request $request)
    {
        $query = Auction::with(['animal', 'owner', 'winner', 'bids']);
        
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($request->has('view') && $request->view === 'all') {
            $myAuctions = [];
            $enrolledAuctions = [];
            
            $query = Auction::with(['animal', 'owner', 'winner', 'bids']);
            
            if ($userRole === 'Admin') {
                $query = $query;
            } elseif ($userRole === 'Owner') {
                $myQuery = clone $query;
                $myQuery->where('owner_id', $userId);
                
                $bidAuctionIds = Bid::where('user_id', $userId)->pluck('auction_id')->toArray();
                $enrolledQuery = clone $query;
                $enrolledQuery->whereIn('id', $bidAuctionIds)->where('owner_id', '!=', $userId);
                
                $myAuctions = $myQuery->where('status', 'active')->orderBy('ends_at', 'asc')->get();
                $enrolledAuctions = $enrolledQuery->where('status', 'active')->orderBy('ends_at', 'asc')->get();
            } else {
                $bidAuctionIds = Bid::where('user_id', $userId)->pluck('auction_id')->toArray();
                $enrolledQuery = clone $query;
                $enrolledAuctions = $enrolledQuery->whereIn('id', $bidAuctionIds)->where('status', 'active')->orderBy('ends_at', 'asc')->get();
            }
            
            $transformAuction = function ($auction) {
                $auction->time_remaining = $auction->timeRemaining();
                $auction->bid_count = $auction->bidCount();
                $auction->current_price = $auction->current_price ?? $auction->starting_price;
                return $auction;
            };
            
            $myAuctions = $myAuctions->map($transformAuction);
            $enrolledAuctions = $enrolledAuctions->map($transformAuction);
            
            return response()->json([
                'my_auctions' => AuctionResource::collection($myAuctions),
                'enrolled_auctions' => AuctionResource::collection($enrolledAuctions),
            ]);
        }

        $query = $this->filterByRole($request, $query);

        if ($request->has('status')) {
            $statuses = $request->status;
            if (is_string($statuses)) {
                $statuses = explode(',', $statuses);
            }
            if (count($statuses) === 1) {
                $query->where('status', $statuses[0]);
            } else {
                $query->whereIn('status', $statuses);
            }
        } else {
            $query->where('status', 'active');
        }

        $auctions = $query->orderBy('ends_at', 'asc')->paginate(12);
        $auctions->getCollection()->transform(function ($auction) {
            $auction->time_remaining = $auction->timeRemaining();
            $auction->bid_count = $auction->bidCount();
            $auction->current_price = $auction->current_price ?? $auction->starting_price;
            return $auction;
        });
        return AuctionResource::collection($auctions);
    }

    public function myAuctions(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $query = Auction::with(['animal', 'owner', 'bids']);
        $query = $this->filterByRole($request, $query);

        $auctions = $query->orderBy('created_at', 'desc')->paginate(10);

        $auctions->getCollection()->transform(function ($auction) {
            $auction->time_remaining = $auction->timeRemaining();
            $auction->bid_count = $auction->bidCount();
            $auction->current_price = $auction->current_price ?? $auction->starting_price;
            return $auction;
        });

        return AuctionResource::collection($auctions);
    }

    public function myBids(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $userId = $request->header('X-User-Id');
        
        $bids = Bid::with(['auction.animal', 'auction.owner', 'user'])
            ->where('user_id', $userId)
            ->orderBy('bid_at', 'desc')
            ->paginate(10);

        return \App\Http\Resources\BidResource::collection($bids);
    }

    public function wonAuctions(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        
        $auctions = Auction::with(['animal', 'owner', 'winner'])
            ->where('winner_id', $userId)
            ->where('status', 'sold')
            ->orderBy('ended_at', 'desc')
            ->get();

        $auctions->transform(function ($auction) {
            $auction->time_remaining = $auction->timeRemaining();
            $auction->bid_count = $auction->bidCount();
            return $auction;
        });

        return response()->json([
            'data' => AuctionResource::collection($auctions),
        ]);
    }

    public function processStripePayment(Request $request, Auction $auction): JsonResponse
    {
        $userId = $request->header('X-User-Id');

        if ($auction->winner_id != $userId) {
            return response()->json(['message' => 'Only the winner can make payment'], 403);
        }

        if ($auction->payment_status !== 'pending') {
            return response()->json(['message' => 'Payment already processed or not in payment phase'], 400);
        }

        if ($auction->paymentExpired()) {
            return response()->json(['message' => 'Payment deadline has passed'], 400);
        }

        $validated = $request->validate([
            'payment_method_id' => 'required|string',
        ]);

        try {
            \Stripe\Stripe::setApiKey(config('services.stripe.secret'));

            $charge = \Stripe\Charge::create([
                'amount' => (int)($auction->current_price * 100),
                'currency' => 'sar',
                'payment_method' => $validated['payment_method_id'],
                'confirm' => true,
                'metadata' => [
                    'auction_id' => $auction->id,
                    'winner_id' => $userId,
                    'animal_id' => $auction->animal_id,
                ],
                'description' => "Payment for Auction #{$auction->id} - {$auction->title}",
            ]);

            if ($charge->status === 'succeeded') {
                $auction->update([
                    'payment_status' => 'verified',
                    'payment_verified_at' => now(),
                    'payment_proof_url' => $charge->receipt_url,
                    'payment_method' => 'stripe',
                    'stripe_charge_id' => $charge->id,
                ]);

                $animal = $auction->animal;
                if ($animal && $auction->winner_id) {
                    $animal->update(['owner_id' => $auction->winner_id]);
                }

                return response()->json([
                    'message' => 'Payment successful!',
                    'data' => new AuctionResource($auction->load(['animal', 'owner', 'winner', 'bids'])),
                    'receipt_url' => $charge->receipt_url,
                ]);
            }

            return response()->json(['message' => 'Payment failed'], 400);
        } catch (\Stripe\Exception\CardException $e) {
            return response()->json([
                'message' => 'Card declined: ' . $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Payment failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'animal_id' => 'required|exists:animals,id',
            'title' => 'required|string|max:255',
            'starting_price' => 'required|numeric|min:1',
            'reserve_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'duration_hours' => 'required|integer|min:1|max:168',
        ]);

        $user = $request->user();
        $userId = $user?->id ?? $request->header('X-User-Id');
        $userRole = $user?->role ?? $request->header('X-User-Role', 'Owner');
        
        // Allow Admin, Owner, Manager to create auctions (not Shepherd or Doctor)
        if (!in_array($userRole, ['Admin', 'Owner', 'Manager'])) {
            return response()->json(['message' => 'Unauthorized to create auctions', 'error' => 'unauthorized'], 403);
        }

        $animal = Animal::findOrFail($validated['animal_id']);
        
        // Check if user has permission to auction this animal
        if ($user && !$this->canCreateAuctionForAuthenticatedUser($user, $animal)) {
            // If not authenticated user check, try owner-based check
            if (!$this->canCreateAuctionForAnimal($request, $animal)) {
                return response()->json(['message' => 'You can only auction animals you have access to', 'error' => 'unauthorized'], 403);
            }
        }
        
        $ownerId = $userId;
        if ($userRole === 'Manager') {
            $user = User::find($userId);
            if ($user && $user->managed_by) {
                $ownerId = $user->managed_by;
            }
        }

        $auction = Auction::create([
            'animal_id' => $validated['animal_id'],
            'owner_id' => $ownerId,
            'title' => $validated['title'],
            'starting_price' => $validated['starting_price'],
            'current_price' => $validated['starting_price'],
            'reserve_price' => $validated['reserve_price'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addHours($validated['duration_hours']),
        ]);

        $auction->load(['animal', 'owner']);
        $auction->time_remaining = $auction->timeRemaining();
        $auction->bid_count = 0;

        return response()->json([
            'message' => 'Auction created successfully',
            'data' => new AuctionResource($auction),
        ], 201);
    }

    public function show(Auction $auction)
    {
        $auction->load(['animal', 'owner', 'bids.user']);
        $auction->time_remaining = $auction->timeRemaining();
        $auction->bid_count = $auction->bidCount();
        return new AuctionResource($auction);
    }

    public function update(Request $request, Auction $auction): JsonResponse
    {
        if (!$this->canAccessAuction($request, $auction)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($auction->bidCount() > 0 && $auction->status === 'active') {
            return response()->json(['message' => 'Cannot modify auction with active bids'], 400);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'starting_price' => 'sometimes|numeric|min:1',
            'reserve_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:draft,active,ended,sold,cancelled',
            'duration_hours' => 'sometimes|integer|min:1|max:168',
        ]);

        if (isset($validated['duration_hours']) && $auction->status !== 'ended') {
            $validated['ends_at'] = now()->addHours($validated['duration_hours']);
        }

        if (isset($validated['starting_price'])) {
            $validated['current_price'] = $validated['starting_price'];
        }

        $auction->update($validated);

        $auction->load(['animal', 'owner', 'bids']);
        $auction->time_remaining = $auction->timeRemaining();
        $auction->bid_count = $auction->bidCount();

        return response()->json([
            'message' => 'Auction updated successfully',
            'data' => new AuctionResource($auction),
        ]);
    }

    public function disqualifyBidder(Request $request, Auction $auction, Bid $bid): JsonResponse
    {
        if (!$this->canAccessAuction($request, $auction)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($bid->auction_id != $auction->id) {
            return response()->json(['message' => 'Bid does not belong to this auction'], 400);
        }

        $wasWinning = $bid->is_winning;
        $bid->delete();

        if ($wasWinning) {
            $highestBid = $auction->bids()->orderBy('amount', 'desc')->first();
            if ($highestBid) {
                $highestBid->update(['is_winning' => true]);
                $auction->update(['current_price' => $highestBid->amount]);
            } else {
                $auction->update(['current_price' => $auction->starting_price]);
            }
        }

        $auction->load(['animal', 'owner', 'bids']);
        $auction->time_remaining = $auction->timeRemaining();
        $auction->bid_count = $auction->bidCount();

        return response()->json([
            'message' => 'Bidder disqualified successfully',
            'data' => new AuctionResource($auction),
        ]);
    }

    public function destroy(Request $request, Auction $auction): JsonResponse
    {
        if (!$this->canAccessAuction($request, $auction)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($auction->bidCount() > 0) {
            return response()->json(['message' => 'Cannot delete auction with bids'], 400);
        }

        $auction->delete();

        return response()->json(['message' => 'Auction deleted successfully']);
    }

    public function placeBid(Request $request, Auction $auction): JsonResponse
    {
        $minimumBid = $auction->current_price + 1;
        
        $validated = $request->validate([
            'amount' => "required|numeric|min:{$minimumBid}",
        ]);

        $userId = $request->header('X-User-Id');

        if ($auction->owner_id == $userId) {
            return response()->json(['message' => 'Cannot bid on your own auction'], 400);
        }

        if (!$auction->isActive()) {
            return response()->json(['message' => 'Auction is not active'], 400);
        }

        $user = \App\Models\User::find($userId);

        $bid = Bid::create([
            'auction_id' => $auction->id,
            'user_id' => $userId,
            'amount' => $validated['amount'],
            'bidder_name' => $user->name ?? 'Anonymous',
            'bid_at' => now(),
        ]);

        $auction->update(['current_price' => $validated['amount']]);
        $auction->load(['animal', 'owner', 'bids.user']);
        $auction->time_remaining = $auction->timeRemaining();
        $auction->bid_count = $auction->bidCount();

        return response()->json([
            'message' => 'Bid placed successfully',
            'data' => new BidResource($bid->load('user')),
            'auction' => new AuctionResource($auction),
        ], 201);
    }

    public function cancel(Request $request, Auction $auction): JsonResponse
    {
        if (!$this->canAccessAuction($request, $auction)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($auction->status === 'sold') {
            return response()->json(['message' => 'Cannot cancel a sold auction'], 400);
        }

        $auction->update([
            'status' => 'cancelled',
            'ended_at' => now(),
        ]);

        $auction->load(['animal', 'owner', 'bids']);
        $auction->time_remaining = $auction->timeRemaining();
        $auction->bid_count = $auction->bidCount();

        return response()->json([
            'message' => 'Auction cancelled successfully',
            'data' => new AuctionResource($auction),
        ]);
    }

    public function endAuction(Request $request, Auction $auction): JsonResponse
    {
        if (!$this->canAccessAuction($request, $auction)) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($auction->status !== 'active') {
            return response()->json(['message' => 'Auction is not active'], 400);
        }

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
            } else {
                $auction->update([
                    'status' => 'ended',
                    'ended_at' => now(),
                ]);
            }
        } else {
            $auction->update([
                'status' => 'ended',
                'ended_at' => now(),
            ]);
        }

        $auction->load(['animal', 'owner', 'winner', 'secondWinner', 'bids']);
        $auction->time_remaining = $auction->timeRemaining();
        $auction->bid_count = $auction->bidCount();

        return response()->json([
            'message' => 'Auction ended',
            'data' => new AuctionResource($auction),
        ]);
    }

    public function uploadPaymentProof(Request $request, Auction $auction): JsonResponse
    {
        $userId = $request->header('X-User-Id');

        if ($auction->winner_id != $userId) {
            return response()->json(['message' => 'Only the winner can upload payment proof'], 403);
        }

        if ($auction->payment_status !== 'pending') {
            return response()->json(['message' => 'Payment proof already uploaded or auction not in payment phase'], 400);
        }

        if ($auction->paymentExpired()) {
            return response()->json(['message' => 'Payment deadline has passed'], 400);
        }

        $validated = $request->validate([
            'payment_proof' => 'required|file|mimes:pdf|max:10240',
        ]);

        $path = $request->file('payment_proof')->store('payment-proofs', 'public');
        $url = asset('storage/' . $path);

        $auction->update([
            'payment_proof_url' => $url,
            'payment_status' => 'submitted',
        ]);

        return response()->json([
            'message' => 'Payment proof uploaded successfully',
            'data' => new AuctionResource($auction->load(['animal', 'owner', 'winner', 'secondWinner', 'bids'])),
        ]);
    }

    public function verifyPayment(Request $request, Auction $auction, string $status): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $userRole = $request->header('X-User-Role');

        if ($userRole !== 'Admin') {
            return response()->json(['message' => 'Only admins can verify payments'], 403);
        }

        if (!in_array($status, ['approved', 'rejected'])) {
            return response()->json(['message' => 'Invalid status'], 400);
        }

        if ($auction->payment_status !== 'submitted') {
            return response()->json(['message' => 'No payment proof submitted'], 400);
        }

        $notes = $request->input('notes');

        if ($status === 'approved') {
            $auction->update([
                'payment_status' => 'verified',
                'payment_verified_at' => now(),
                'verified_by' => $userId,
                'payment_notes' => $notes,
            ]);
            
            $animal = $auction->animal;
            if ($animal && $auction->winner_id) {
                $animal->update([
                    'owner_id' => $auction->winner_id,
                ]);
            }
        } else {
            $auction->update([
                'payment_status' => 'rejected',
                'verified_by' => $userId,
                'payment_notes' => $notes,
                'payment_expires_at' => now()->addHours(24),
            ]);

            $secondWinner = $auction->secondWinner;
            if ($secondWinner) {
                $auction->update([
                    'winner_id' => $secondWinner->id,
                    'second_winner_id' => null,
                    'payment_status' => 'pending',
                ]);
            }
        }

        return response()->json([
            'message' => 'Payment ' . ($status === 'approved' ? 'verified' : 'rejected'),
            'data' => new AuctionResource($auction->load(['animal', 'owner', 'winner', 'secondWinner', 'verifier', 'bids'])),
        ]);
    }

    public function processExpiredPayments(): JsonResponse
    {
        $expiredAuctions = Auction::where('status', 'sold')
            ->where('payment_status', 'pending')
            ->where('payment_expires_at', '<', now())
            ->get();

        $processed = 0;

        foreach ($expiredAuctions as $auction) {
            $secondWinner = $auction->secondWinner;
            
            if ($secondWinner) {
                $auction->update([
                    'winner_id' => $secondWinner->id,
                    'second_winner_id' => null,
                    'payment_expires_at' => now()->addHours(24),
                    'payment_status' => 'pending',
                ]);
            } else {
                $auction->update([
                    'status' => 'ended',
                    'payment_status' => 'expired',
                ]);
            }
            
            $processed++;
        }

        return response()->json([
            'message' => "Processed {$processed} expired payments",
        ]);
    }
}