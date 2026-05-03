<?php

namespace App\Http\Controllers\Api\Business;

use App\Models\SubscriptionTier;
use App\Models\UserSubscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Stripe\Stripe;
use Stripe\Charge;
use App\Http\Controllers\Controller;

class SubscriptionController extends Controller
{
    public function tiers(): JsonResponse
    {
        $tiers = SubscriptionTier::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $tiers]);
    }

    public function showTier(SubscriptionTier $tier): JsonResponse
    {
        return response()->json(['data' => $tier]);
    }

    public function userSubscription(Request $request): JsonResponse
    {
        $requestingUserId = $request->header('X-User-Id');
        $requestingUserRole = $request->header('X-User-Role');
        
        $targetUserId = $request->input('user_id') ?: $requestingUserId;
        
        if ($requestingUserRole !== 'Admin' && $targetUserId != $requestingUserId) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }
        
        $user = User::find($targetUserId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $subscription = $user->subscription()
            ->with('tier')
            ->latest()
            ->first();

        $activeSubscription = $user->subscription()
            ->with('tier')
            ->where('status', 'active')
            ->first();

        $tier = $user->subscriptionTier;

        $limits = [
            'animals' => [
                'used' => $user->getAnimalCount(),
                'max' => $tier?->max_animals ?? 0,
            ],
            'devices' => [
                'used' => $user->getDeviceCount(),
                'max' => $tier?->max_devices ?? 0,
            ],
            'users' => [
                'used' => $user->getUserCount(),
                'max' => $tier?->max_users ?? 0,
            ],
        ];

        return response()->json([
            'data' => $subscription ?? [
                'id' => null,
                'user_id' => $user->id,
                'tier_id' => $tier?->id,
                'status' => $tier ? ($activeSubscription ? 'active' : 'pending') : 'none',
            ],
            'subscription' => $subscription,
            'tier' => $tier,
            'limits' => $limits,
        ]);
    }

    public function subscribe(Request $request, SubscriptionTier $tier): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $existingSubscription = $user->subscription()
            ->where('status', 'active')
            ->first();

        if ($existingSubscription) {
            return response()->json(['message' => 'Already have an active subscription'], 400);
        }

        $pendingSubscription = $user->subscription()
            ->where('status', 'pending_payment')
            ->first();

        if ($pendingSubscription) {
            $pendingSubscription->update([
                'tier_id' => $tier->id,
                'status' => 'active',
                'started_at' => now(),
                'trial_ends_at' => $tier->trial_days > 0 ? now()->addDays($tier->trial_days) : null,
                'ends_at' => now()->addDays($tier->trial_days > 0 ? $tier->trial_days : 30),
            ]);
            
            $user->update(['subscription_tier_id' => $tier->id]);
            
            return response()->json([
                'message' => 'Subscription activated successfully',
                'data' => $pendingSubscription->load('tier'),
            ]);
        }

        $subscription = UserSubscription::create([
            'user_id' => $user->id,
            'tier_id' => $tier->id,
            'status' => 'active',
            'started_at' => now(),
            'trial_ends_at' => $tier->trial_days > 0 ? now()->addDays($tier->trial_days) : null,
            'ends_at' => now()->addDays($tier->trial_days > 0 ? $tier->trial_days : 30),
            'billing_cycle' => 'monthly',
        ]);

        $user->update(['subscription_tier_id' => $tier->id]);

        return response()->json([
            'message' => 'Subscription created successfully',
            'data' => $subscription->load('tier'),
        ], 201);
    }

    public function upgrade(Request $request, SubscriptionTier $tier): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $currentSubscription = $user->subscription()
            ->where('status', 'active')
            ->first();

        if (!$currentSubscription) {
            return response()->json(['message' => 'No active subscription to upgrade'], 400);
        }

        $currentSubscription->update(['status' => 'upgraded']);

        $subscription = UserSubscription::create([
            'user_id' => $user->id,
            'tier_id' => $tier->id,
            'status' => 'active',
            'started_at' => now(),
            'trial_ends_at' => $tier->trial_days > 0 ? now()->addDays($tier->trial_days) : null,
            'ends_at' => now()->addDays($tier->trial_days > 0 ? $tier->trial_days : 30),
            'billing_cycle' => $request->input('billing_cycle', 'monthly'),
        ]);

        $user->update(['subscription_tier_id' => $tier->id]);

        return response()->json([
            'message' => 'Subscription upgraded successfully',
            'data' => $subscription->load('tier'),
        ]);
    }

    public function downgrade(Request $request, SubscriptionTier $tier): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $currentSubscription = $user->subscription()
            ->where('status', 'active')
            ->first();

        if (!$currentSubscription) {
            return response()->json(['message' => 'No active subscription to downgrade'], 400);
        }

        $currentSubscription->update(['status' => 'downgraded']);

        $subscription = UserSubscription::create([
            'user_id' => $user->id,
            'tier_id' => $tier->id,
            'status' => 'active',
            'started_at' => now(),
            'ends_at' => now()->addDays(30),
            'billing_cycle' => 'monthly',
        ]);

        $user->update(['subscription_tier_id' => $tier->id]);

        return response()->json([
            'message' => 'Subscription downgraded successfully',
            'data' => $subscription->load('tier'),
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $subscription = $user->subscription()
            ->where('status', 'active')
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'No active subscription to cancel'], 400);
        }

        $subscription->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $freeTier = SubscriptionTier::where('slug', 'free')->first();
        if ($freeTier) {
            $user->update(['subscription_tier_id' => $freeTier->id]);
        }

        return response()->json([
            'message' => 'Subscription cancelled successfully',
            'data' => $subscription->load('tier'),
        ]);
    }

    public function adminSetTier(Request $request, User $user, SubscriptionTier $tier): JsonResponse
    {
        $adminId = $request->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $existingSubscription = $user->subscription()
            ->where('status', 'active')
            ->first();

        if ($existingSubscription) {
            $existingSubscription->update(['status' => 'changed_by_admin']);
        }

        $subscription = UserSubscription::create([
            'user_id' => $user->id,
            'tier_id' => $tier->id,
            'status' => 'active',
            'started_at' => now(),
            'trial_ends_at' => $tier->trial_days > 0 ? now()->addDays($tier->trial_days) : null,
            'ends_at' => now()->addDays($tier->trial_days > 0 ? $tier->trial_days : 365),
        ]);

        $user->update(['subscription_tier_id' => $tier->id]);

        return response()->json([
            'message' => 'Subscription tier set successfully',
            'data' => $subscription->load('tier'),
        ]);
    }

    public function adminListSubscriptions(Request $request): JsonResponse
    {
        $adminId = $request->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $users = User::with('subscriptionTier')
            ->whereNotNull('subscription_tier_id')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'user_id' => $user->id,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->getPrimaryRoleName(),
                    ],
                    'tier_id' => $user->subscription_tier_id,
                    'tier' => $user->subscriptionTier,
                    'status' => 'active',
                ];
            });

        return response()->json(['data' => $users]);
    }

    public function createTier(Request $request): JsonResponse
    {
        $adminId = $request->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subscription_tiers,slug',
            'description' => 'nullable|string',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'trial_days' => 'nullable|integer|min:0',
            'max_animals' => 'required|integer|min:0',
            'max_devices' => 'required|integer|min:0',
            'max_users' => 'required|integer|min:0',
            'has_geofencing' => 'nullable|boolean',
            'has_auctions' => 'nullable|boolean',
            'has_advanced_reports' => 'nullable|boolean',
            'has_api_access' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $tier = SubscriptionTier::create($validated);

        return response()->json([
            'message' => 'Tier created successfully',
            'data' => $tier,
        ], 201);
    }

    public function updateTier(Request $request, SubscriptionTier $tier): JsonResponse
    {
        $adminId = $request->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|max:255|unique:subscription_tiers,slug,' . $tier->id,
            'description' => 'nullable|string',
            'price_monthly' => 'sometimes|numeric|min:0',
            'price_yearly' => 'sometimes|numeric|min:0',
            'trial_days' => 'nullable|integer|min:0',
            'max_animals' => 'sometimes|integer|min:0',
            'max_devices' => 'sometimes|integer|min:0',
            'max_users' => 'sometimes|integer|min:0',
            'has_geofencing' => 'nullable|boolean',
            'has_auctions' => 'nullable|boolean',
            'has_advanced_reports' => 'nullable|boolean',
            'has_api_access' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $tier->update($validated);

        return response()->json([
            'message' => 'Tier updated successfully',
            'data' => $tier,
        ]);
    }

    public function deleteTier(SubscriptionTier $tier): JsonResponse
    {
        $adminId = request()->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($tier->slug === 'free') {
            return response()->json(['message' => 'Cannot delete the free tier'], 400);
        }

        $tier->update(['is_active' => false]);

        return response()->json(['message' => 'Tier deactivated successfully']);
    }

    public function processPayment(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'tier_id' => 'required|exists:subscription_tiers,id',
            'card_number' => 'required|string',
            'expiry' => 'required|string',
            'cvc' => 'required|string',
        ]);

        $tier = SubscriptionTier::find($validated['tier_id']);

        if ($tier->price_monthly === '0.00') {
            $this->activateSubscription($user, $tier);
            return response()->json(['message' => 'Free subscription activated']);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $charge = Charge::create([
                'amount' => (float)$tier->price_monthly * 100,
                'currency' => 'usd',
                'source' => 'tok_visa',
                'description' => "Subscription to {$tier->name} plan",
                'metadata' => [
                    'user_id' => $user->id,
                    'tier_id' => $tier->id,
                ],
            ]);

            if ($charge->status === 'succeeded') {
                $this->activateSubscription($user, $tier);
                
                UserSubscription::create([
                    'user_id' => $user->id,
                    'tier_id' => $tier->id,
                    'status' => 'active',
                    'started_at' => now(),
                    'ends_at' => now()->addDays(30),
                    'billing_cycle' => 'monthly',
                    'payment_method' => 'card',
                    'payment_reference' => $charge->id,
                ]);

                return response()->json([
                    'message' => 'Payment successful',
                    'payment_id' => $charge->id,
                ]);
            }

            return response()->json(['message' => 'Payment failed'], 400);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Payment error: ' . $e->getMessage()], 400);
        }
    }

    public function bankTransfer(Request $request): JsonResponse
    {
        $userId = $request->header('X-User-Id');
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'tier_id' => 'required|exists:subscription_tiers,id',
            'payment_proof' => 'required|file|mimes:pdf|max:10240',
        ]);

        $tier = SubscriptionTier::find($validated['tier_id']);
        $path = $request->file('payment_proof')->store('subscription-payments', 'public');

        UserSubscription::create([
            'user_id' => $user->id,
            'tier_id' => $tier->id,
            'status' => 'pending_payment',
            'started_at' => now(),
            'ends_at' => now()->addDays(7),
            'billing_cycle' => 'monthly',
            'payment_method' => 'bank_transfer',
            'payment_reference' => asset('storage/' . $path),
        ]);

        return response()->json([
            'message' => 'Bank transfer proof uploaded. You will be notified once approved.',
        ]);
    }

    protected function activateSubscription(User $user, SubscriptionTier $tier): void
    {
        $user->update(['subscription_tier_id' => $tier->id]);
    }

    public function adminApprovePayment(Request $request, UserSubscription $subscription): JsonResponse
    {
        $adminId = $request->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($subscription->status !== 'pending_payment') {
            return response()->json(['message' => 'This subscription is not pending approval'], 400);
        }

        $user = User::find($subscription->user_id);
        $tier = SubscriptionTier::find($subscription->tier_id);

        if (!$user || !$tier) {
            return response()->json(['message' => 'User or tier not found'], 404);
        }

        $subscription->update([
            'status' => 'active',
            'started_at' => now(),
            'ends_at' => now()->addDays(30),
        ]);

        $user->update(['subscription_tier_id' => $tier->id]);

        return response()->json([
            'message' => 'Payment approved and subscription activated',
            'data' => $subscription->load(['user', 'tier']),
        ]);
    }

    public function adminRejectPayment(Request $request, UserSubscription $subscription): JsonResponse
    {
        $adminId = $request->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        if ($subscription->status !== 'pending_payment') {
            return response()->json(['message' => 'This subscription is not pending approval'], 400);
        }

        $subscription->update(['status' => 'rejected']);

        return response()->json([
            'message' => 'Payment rejected',
            'data' => $subscription,
        ]);
    }

    public function adminListPendingPayments(Request $request): JsonResponse
    {
        $adminId = $request->header('X-User-Id');
        $admin = User::find($adminId);

        if (!$admin || !$admin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized', 'error' => 'unauthorized'], 403);
        }

        $pendingSubscriptions = UserSubscription::with(['user', 'tier'])
            ->where('status', 'pending_payment')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $pendingSubscriptions]);
    }
}