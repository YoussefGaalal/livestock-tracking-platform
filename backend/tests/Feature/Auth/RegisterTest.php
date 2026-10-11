<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class RegisterTest extends TestCase
{
    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Owner',
            'email' => 'new.owner@example.com',
            'phone' => '+1234567890',
            'password' => 'securePassword123',
            'password_confirmation' => 'securePassword123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.email', 'new.owner@example.com');

        $user = \App\Models\User::where('email', 'new.owner@example.com')->firstOrFail();
        $this->assertTrue($user->hasRole('Owner'));
    }

    public function test_registration_requires_all_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registration_requires_unique_email(): void
    {
        $this->createUser(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'existing@example.com',
            'phone' => '+1234567890',
            'password' => 'securePassword123',
            'password_confirmation' => 'securePassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_requires_matching_passwords(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'phone' => '+1234567890',
            'password' => 'password123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_registration_requires_minimum_password_length(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'phone' => '+1234567890',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}