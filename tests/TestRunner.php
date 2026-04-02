<?php

/**
 * Simple Unit Test Runner for Healthcare AI System
 * Run with: php tests/TestRunner.php
 */

class TestRunner {
    private $tests = [];
    private $passed = 0;
    private $failed = 0;

    public function addTest($name, $callback) {
        $this->tests[$name] = $callback;
    }

    public function run() {
        echo "🏥 Healthcare AI - Unit Tests\n";
        echo "==============================\n\n";

        foreach ($this->tests as $name => $test) {
            try {
                $test();
                echo "✅ PASS: $name\n";
                $this->passed++;
            } catch (Exception $e) {
                echo "❌ FAIL: $name - " . $e->getMessage() . "\n";
                $this->failed++;
            }
        }

        echo "\n📊 Results: Total: " . ($this->passed + $this->failed) .
             ", Passed: {$this->passed}, Failed: {$this->failed}\n";

        return $this->failed === 0;
    }
}

// Enable assert to throw exceptions
assert_options(ASSERT_ACTIVE, 1);
assert_options(ASSERT_WARNING, 0);
assert_options(ASSERT_BAIL, 0);
assert_options(ASSERT_CALLBACK, function($file, $line, $code, $desc = null) {
    throw new AssertionError($desc ?: 'Assertion failed');
});

// Custom assertion error
class AssertionError extends Exception {}

// Load test files
$testFiles = glob(__DIR__ . '/*Test.php');
$runner = new TestRunner();

foreach ($testFiles as $file) {
    require_once $file;
}

echo "Running tests...\n";
$success = $runner->run();

exit($success ? 0 : 1);
