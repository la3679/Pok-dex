param(
    [ValidateSet('up', 'down', 'reset', 'logs', 'seed', 'seed-quick', 'validate', 'test', 'build')]
    [string]$Command = 'up'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

switch ($Command) {
    'up' {
        docker compose up --build
    }
    'down' {
        docker compose down
    }
    'reset' {
        docker compose down -v
    }
    'logs' {
        docker compose logs -f
    }
    'seed' {
        docker compose run --rm seed
    }
    'seed-quick' {
        docker compose run --rm seed python -m scripts.seed_database --skip-legacy --max-records 25
    }
    'validate' {
        docker compose run --rm validate
    }
    'test' {
        docker compose run --rm backend-test
        docker compose run --rm frontend-test
    }
    'build' {
        docker compose run --rm frontend-build
    }
}
