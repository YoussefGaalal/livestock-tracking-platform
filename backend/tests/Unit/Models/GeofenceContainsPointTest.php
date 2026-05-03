<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Geofence;

class GeofenceContainsPointTest extends TestCase
{
    public function test_point_inside_square_geofence(): void
    {
        $geofence = $this->createGeofence([
            'coordinates' => [
                [31.0, 29.0],
                [31.0, 30.0],
                [32.0, 30.0],
                [32.0, 29.0],
            ],
        ]);

        $this->assertTrue($geofence->containsPoint(31.5, 29.5));
    }

    public function test_point_outside_square_geofence(): void
    {
        $geofence = $this->createGeofence([
            'coordinates' => [
                [31.0, 29.0],
                [31.0, 30.0],
                [32.0, 30.0],
                [32.0, 29.0],
            ],
        ]);

        $this->assertFalse($geofence->containsPoint(30.5, 29.5));
    }

    public function test_point_on_geofence_boundary_returns_true(): void
    {
        $geofence = $this->createGeofence([
            'coordinates' => [
                [31.0, 29.0],
                [31.0, 30.0],
                [32.0, 30.0],
                [32.0, 29.0],
            ],
        ]);

        $this->assertTrue($geofence->containsPoint(31.0, 29.5));
    }

    public function test_geofence_with_less_than_3_points_returns_false(): void
    {
        $geofence = $this->createGeofence([
            'coordinates' => [
                [31.0, 29.0],
                [31.0, 30.0],
            ],
        ]);

        $this->assertFalse($geofence->containsPoint(31.5, 29.5));
    }

    public function test_triangular_geofence_point_inside(): void
    {
        $geofence = $this->createGeofence([
            'coordinates' => [
                [31.0, 29.0],
                [31.5, 30.0],
                [32.0, 29.0],
            ],
        ]);

        $this->assertTrue($geofence->containsPoint(31.5, 29.5));
    }

    public function test_complex_polygon_contains_point(): void
    {
        $geofence = $this->createGeofence([
            'coordinates' => [
                [31.0, 29.0],
                [31.0, 30.5],
                [31.5, 31.0],
                [32.0, 30.5],
                [32.0, 29.0],
                [31.5, 28.5],
            ],
        ]);

        $this->assertTrue($geofence->containsPoint(31.5, 30.0));
    }
}