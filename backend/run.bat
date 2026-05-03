@echo off
cd C:\animal-tracking-system-head\backend
"C:\php82\php.exe" -d memory_limit=1024M artisan serve --host=127.0.0.1 --port=8050