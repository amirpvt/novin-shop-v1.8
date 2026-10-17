<?php
$root = dirname(__DIR__);
$failed = 0;
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($it as $file) {
    if ($file->getExtension() !== 'php') {
        continue;
    }
    $path = $file->getPathname();
    $code = file_get_contents($path);
    try {
        token_get_all($code, TOKEN_PARSE);
    } catch (Throwable $e) {
        $failed++;
        fwrite(STDOUT, "PARSE $path {$e->getMessage()}\n");
    }
}
if ($failed > 0) {
    fwrite(STDOUT, "$failed parse errors\n");
    exit(1);
}
fwrite(STDOUT, "lint ok\n");
