<?php

namespace App\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Trait FileUploadTrait
 * 
 * Handles file upload operations for models.
 * Provides methods for uploading, storing, and managing files.
 */
trait FileUploadTrait
{
    /**
     * Upload a file to storage
     * 
     * @param UploadedFile $file
     * @param string $path
     * @param string $disk
     * @return string|false
     */
    public function uploadFile(UploadedFile $file, $path = 'uploads', $disk = 'public')
    {
        try {
            // Generate unique filename
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Store the file
            $storagePath = Storage::disk($disk)->putFileAs(
                $path,
                $file,
                $filename
            );

            return $storagePath;
        } catch (\Exception $e) {
            \Log::error('File upload failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Upload multiple files
     * 
     * @param array $files
     * @param string $path
     * @param string $disk
     * @return array
     */
    public function uploadFiles(array $files, $path = 'uploads', $disk = 'public'): array
    {
        $uploadedPaths = [];

        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $uploadedPath = $this->uploadFile($file, $path, $disk);
                if ($uploadedPath) {
                    $uploadedPaths[] = $uploadedPath;
                }
            }
        }

        return $uploadedPaths;
    }

    /**
     * Delete a file from storage
     * 
     * @param string $path
     * @param string $disk
     * @return bool
     */
    public function deleteFile($path, $disk = 'public'): bool
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->delete($path);
            }
            return true;
        } catch (\Exception $e) {
            \Log::error('File deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete multiple files
     * 
     * @param array $paths
     * @param string $disk
     * @return bool
     */
    public function deleteFiles(array $paths, $disk = 'public'): bool
    {
        try {
            return Storage::disk($disk)->delete($paths);
        } catch (\Exception $e) {
            \Log::error('Files deletion failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get file URL
     * 
     * @param string $path
     * @param string $disk
     * @return string
     */
    public function getFileUrl($path, $disk = 'public'): string
    {
        return Storage::disk($disk)->url($path);
    }

    /**
     * Check if file exists
     * 
     * @param string $path
     * @param string $disk
     * @return bool
     */
    public function fileExists($path, $disk = 'public'): bool
    {
        return Storage::disk($disk)->exists($path);
    }
}
