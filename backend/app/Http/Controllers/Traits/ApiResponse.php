<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    public function success(mixed $data = null, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    public function error(string $message = 'Error', int $code = 400, mixed $errors = null, string $errorCode = 'error'): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
            'error' => $errorCode,
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    public function created(mixed $data = null, string $message = 'Created successfully'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    public function updated(mixed $data = null, string $message = 'Updated successfully'): JsonResponse
    {
        return $this->success($data, $message, 200);
    }

    public function deleted(string $message = 'Deleted successfully'): JsonResponse
    {
        return $this->success(null, $message, 200);
    }

    public function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, 404);
    }

    public function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error($message, 401);
    }

    public function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error($message, 403);
    }

    public function validationError(mixed $errors): JsonResponse
    {
        return $this->error('Validation failed', 422, $errors);
    }

    public function paginated(LengthAwarePaginator $paginator, string $message = 'Success'): JsonResponse
    {
        return $this->success([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_more_pages' => $paginator->hasMorePages(),
            ],
        ], $message);
    }
}