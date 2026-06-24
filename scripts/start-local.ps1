$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

docker compose up -d mongo
Start-Process -WindowStyle Hidden -FilePath .\.venv\Scripts\python.exe -ArgumentList 'app.py' -WorkingDirectory "$root\backend"
Start-Process -WindowStyle Hidden -FilePath npm.cmd -ArgumentList 'run', 'dev' -WorkingDirectory "$root\frontend"

Write-Host 'Frontend: http://localhost:3000/'
Write-Host 'Backend:  http://localhost:5000'
