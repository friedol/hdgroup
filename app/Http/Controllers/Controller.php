<?php

namespace App\Http\Controllers;

abstract class Controller
{
    public function phpInitialize(array $settings = [])
    {
        // Default values
        $defaults = [
            'upload_max_filesize' => '100M',  // Maximum file size for uploads
            'post_max_size' => '100M',       // Maximum size of POST data
            'max_execution_time' => '300',   // Maximum execution time (in seconds)
            'max_input_time' => '300',        // Maximum input time (in seconds)
        ];

        // Merge user-provided settings with defaults
        $config = array_merge($defaults, $settings);

        // Apply each setting dynamically
        foreach ($config as $key => $value) {
            ini_set($key, $value);
        }
    }
}
