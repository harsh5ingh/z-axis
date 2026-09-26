$ErrorActionPreference = "Stop"

# ============================================================
# Z-Axis / GeoVISTA
# Azure Blob Storage - Runtime Dataset Upload
# ============================================================

$StorageAccount = "zaxisbhopal3d"
$Container      = "3d-data"

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# ------------------------------------------------------------
# Files to upload
# Local path                                      Blob path
# ------------------------------------------------------------

$Uploads = @(
    @{
        Local = Join-Path $ProjectRoot "data\processed\buildings\bhopal_buildings_3d.geojson"
        Blob  = "buildings/bhopal_buildings_3d.geojson"
        Type  = "application/geo+json"
    },
    @{
        Local = Join-Path $ProjectRoot "data\raw\bhopal_boundary\bhopal_boundary.geojson"
        Blob  = "boundaries/bhopal_boundary.geojson"
        Type  = "application/geo+json"
    },
    @{
        Local = Join-Path $ProjectRoot "data\raw\bhopal_boundary\Bhopal_wards.geojson"
        Blob  = "boundaries/Bhopal_wards.geojson"
        Type  = "application/geo+json"
    },
    @{
        Local = Join-Path $ProjectRoot "data\dem\bhopal_dem_clipped.tif"
        Blob  = "terrain/bhopal_dem_clipped.tif"
        Type  = "image/tiff"
    }
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Z-Axis Azure Dataset Upload" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# Check Azure CLI
# ------------------------------------------------------------

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Azure CLI is not installed." -ForegroundColor Red
    Write-Host "Install it from: https://learn.microsoft.com/cli/azure/install-azure-cli"
    exit 1
}

# ------------------------------------------------------------
# Check Azure login
# ------------------------------------------------------------

Write-Host "[1/4] Checking Azure login..." -ForegroundColor Yellow

$account = az account show 2>$null | ConvertFrom-Json

if (-not $account) {
    Write-Host "Not logged in. Opening Azure login..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}

Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "Subscription: $($account.name)" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# Verify storage account
# ------------------------------------------------------------

Write-Host "[2/4] Checking storage account..." -ForegroundColor Yellow

$storage = az storage account show `
    --name $StorageAccount `
    --query "{name:name,location:primaryLocation,status:provisioningState}" `
    --output json 2>$null

if (-not $storage) {
    Write-Host "Storage account '$StorageAccount' was not found." -ForegroundColor Red
    exit 1
}

$storageInfo = $storage | ConvertFrom-Json

Write-Host "Storage account: $($storageInfo.name)" -ForegroundColor Green
Write-Host "Location: $($storageInfo.location)" -ForegroundColor Green
Write-Host "Status: $($storageInfo.status)" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# Check container
# ------------------------------------------------------------

Write-Host "[3/4] Checking container '$Container'..." -ForegroundColor Yellow

$containerExists = az storage container exists `
    --account-name $StorageAccount `
    --name $Container `
    --auth-mode login `
    --query exists `
    --output tsv

if ($containerExists -ne "true") {
    Write-Host "Container does not exist. Creating..." -ForegroundColor Yellow

    az storage container create `
        --account-name $StorageAccount `
        --name $Container `
        --auth-mode login `
        --public-access off `
        --output none

    Write-Host "Container created." -ForegroundColor Green
}
else {
    Write-Host "Container already exists." -ForegroundColor Green
}

Write-Host ""

# ------------------------------------------------------------
# Upload selected files
# ------------------------------------------------------------

Write-Host "[4/4] Uploading selected runtime datasets..." -ForegroundColor Yellow
Write-Host ""

foreach ($item in $Uploads) {

    $localPath = $item.Local
    $blobPath  = $item.Blob
    $contentType = $item.Type

    if (-not (Test-Path $localPath)) {
        Write-Host "MISSING: $localPath" -ForegroundColor Red
        continue
    }

    $sizeMB = [math]::Round(
        (Get-Item $localPath).Length / 1MB,
        2
    )

    Write-Host "Uploading:" -ForegroundColor Cyan
    Write-Host "  Local : $localPath"
    Write-Host "  Blob  : $Container/$blobPath"
    Write-Host "  Size  : $sizeMB MB"

    az storage blob upload `
        --account-name $StorageAccount `
        --container-name $Container `
        --name $blobPath `
        --file $localPath `
        --auth-mode login `
        --content-type $contentType `
        --overwrite false `
        --only-show-errors

    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $blobPath" -ForegroundColor Red
        exit 1
    }

    Write-Host "OK" -ForegroundColor Green
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Green
Write-Host " Upload complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Uploaded structure:" -ForegroundColor Cyan
Write-Host ""
Write-Host "3d-data/"
Write-Host "├── buildings/"
Write-Host "│   └── bhopal_buildings_3d.geojson"
Write-Host "├── boundaries/"
Write-Host "│   ├── bhopal_boundary.geojson"
Write-Host "│   └── Bhopal_wards.geojson"
Write-Host "└── terrain/"
Write-Host "    └── bhopal_dem_clipped.tif"
Write-Host ""