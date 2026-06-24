param(
    [switch]$ResetDatabase
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path 'data/300k.csv')) {
    throw 'Missing data/300k.csv. Download and extract the Predict''em All dataset first.'
}

if ($ResetDatabase) {
    docker compose down -v
}

docker compose up -d mongo

do {
    Start-Sleep -Seconds 2
    try {
    docker compose exec -T mongo mongosh --quiet --eval 'db.runCommand({ ping: 1 })' 2>$null | Out-Null
        $mongoReady = $LASTEXITCODE -eq 0
    } catch {
        $mongoReady = $false
    }
} until ($mongoReady)

$stats = Get-Content -Raw -LiteralPath 'frontend\archive (1)\pokemon_v2.csv'
$stats -replace '^No\.,', 'No,' | docker compose exec -T mongo mongoimport --quiet --drop --db PokeMap --collection PokemonStats --type csv --headerline
if ($LASTEXITCODE -ne 0) {
    throw 'Pokémon stats import failed.'
}
docker compose exec -T mongo mongoimport --quiet --drop --db PokeMap --collection PokemonSightings --type csv --headerline --file /seed/data/300k.csv
if ($LASTEXITCODE -ne 0) {
    throw 'Pokémon sightings import failed.'
}

if (-not (Test-Path '.venv')) {
    python -m venv .venv
}
& .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt

$env:MONGO_URI = 'mongodb://localhost:27018/PokeMap'
Push-Location frontend
& ..\.venv\Scripts\python.exe pokemon_script.py
Pop-Location

npm --prefix frontend ci
if (-not (Test-Path 'backend\.env.local')) {
    @"
MONGO_URI=mongodb://localhost:27018/PokeMap
MONGO_DATABASE=PokeMap
FLASK_ENV=development
FLASK_DEBUG=true
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000
"@ | Set-Content -NoNewline backend\.env.local
}
if (-not (Test-Path 'frontend\.env.local')) {
    Copy-Item frontend\.env.example frontend\.env.local
}

Write-Host 'Setup complete. Add your Google Maps key to frontend/.env.local, then run scripts/start-local.ps1.'
