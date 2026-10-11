<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Regression tests for access-control and data-exposure issues.
 */
class SecurityTest extends TestCase
{
    public function test_identity_headers_cannot_be_spoofed_to_gain_admin(): void
    {
        $owner = $this->createUser(['email' => 'owner@example.com']);

        $this->actingAs($owner)
            ->withHeaders(['X-User-Role' => 'Admin', 'X-User-Id' => '1'])
            ->getJson('/api/export/database')
            ->assertStatus(403);
    }

    public function test_only_admins_can_export_platform_data(): void
    {
        $owner = $this->createUser(['email' => 'owner@example.com']);
        $admin = $this->createUser(['email' => 'admin@example.com', 'role' => 'Admin']);

        foreach (['animals', 'devices', 'geofences', 'users'] as $resource) {
            $this->actingAs($owner)->getJson("/api/export/{$resource}")->assertStatus(403);
        }

        $this->actingAs($admin)->getJson('/api/export/animals')->assertStatus(200);
    }

    public function test_admin_routes_accept_real_admins(): void
    {
        $admin = $this->createUser(['email' => 'admin@example.com', 'role' => 'Admin']);

        $this->actingAs($admin)->getJson('/api/admin/settings/general')->assertStatus(200);
    }

    public function test_settings_api_never_returns_stored_secrets(): void
    {
        $admin = $this->createUser(['email' => 'admin@example.com', 'role' => 'Admin']);
        $secret = 'sk_live_51Hxyz' . str_repeat('a', 24) . 'WXYZ';

        $this->actingAs($admin)->postJson('/api/admin/settings/stripe', [
            'public_key' => 'pk_live_123',
            'secret_key' => $secret,
            'enabled' => true,
        ])->assertStatus(200);

        $response = $this->actingAs($admin)->getJson('/api/admin/settings/stripe')->assertStatus(200);

        $this->assertStringNotContainsString($secret, $response->getContent());
        $this->assertStringEndsWith('WXYZ', $response->json('data.secret_key'));
    }

    public function test_saving_a_masked_secret_keeps_the_stored_value(): void
    {
        $admin = $this->createUser(['email' => 'admin@example.com', 'role' => 'Admin']);
        $secret = 'AIzaSy' . str_repeat('b', 30);

        $this->actingAs($admin)->postJson('/api/admin/settings/gemini', [
            'api_key' => $secret, 'model' => 'gemini-2.0-flash', 'enabled' => true,
        ])->assertStatus(200);

        $masked = $this->actingAs($admin)->getJson('/api/admin/settings/gemini')->json('data.api_key');

        $this->actingAs($admin)->postJson('/api/admin/settings/gemini', [
            'api_key' => $masked, 'model' => 'gemini-2.0-flash', 'enabled' => true,
        ])->assertStatus(200);

        $this->assertSame($secret, DB::table('settings')->where('key', 'gemini_api_key')->value('value'));
    }

    public function test_non_admins_cannot_modify_the_species_catalogue(): void
    {
        $owner = $this->createUser(['email' => 'owner@example.com']);

        $this->actingAs($owner)->postJson('/api/species', ['name' => 'Ostrich'])->assertStatus(403);
        $this->assertDatabaseMissing('species', ['name' => 'Ostrich']);
    }

    public function test_protected_endpoints_reject_anonymous_requests(): void
    {
        foreach (['/api/animals', '/api/devices', '/api/users', '/api/ai/status', '/api/export/database'] as $uri) {
            $this->getJson($uri)->assertStatus(401);
        }
    }

    public function test_health_check_does_not_disclose_framework_version(): void
    {
        $this->getJson('/health')
            ->assertStatus(200)
            ->assertExactJson(['status' => 'ok']);
    }
}
