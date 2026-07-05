<#
.SYNOPSIS
  SilverCare Thailand - Full Environment Setup Script
.DESCRIPTION
  Installs all dependencies, generates PWA icons, and validates the setup.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = "D:\Workspace\thai-silver-saas"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SilverCare Thailand - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "  Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Step 2: Check npm
Write-Host "[2/6] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  npm v$npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "  npm not found." -ForegroundColor Red
    exit 1
}

# Step 3: Install project dependencies
Write-Host "[3/6] Installing project dependencies..." -ForegroundColor Yellow
Set-Location -LiteralPath $ProjectRoot
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed successfully" -ForegroundColor Green

# Step 4: Install additional global tools
Write-Host "[4/6] Checking additional tools..." -ForegroundColor Yellow

# Bubblewrap
try {
    $bwVersion = npx @pwabuilder/cli --version
    Write-Host "  Bubblewrap CLI available" -ForegroundColor Green
} catch {
    Write-Host "  Installing @pwabuilder/cli..." -ForegroundColor Yellow
    npm install -g @pwabuilder/cli
}

# Playwright browsers
Write-Host "  Installing Playwright browsers..." -ForegroundColor Yellow
npx playwright install chromium
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Playwright Chromium installed" -ForegroundColor Green
}

# Step 5: Generate PWA icons
Write-Host "[5/6] Generating PWA icons..." -ForegroundColor Yellow
$iconsDir = "$ProjectRoot\public\icons"
if (-not (Test-Path -LiteralPath $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

# Generate minimal SVG icons (placeholder - replace with real ones)
$iconSizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($size in $iconSizes) {
    $svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" width="$size" height="$size" viewBox="0 0 $size $size">
  <rect width="$size" height="$size" rx="$(($size * 0.2))" fill="#1a73e8"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        fill="white" font-size="$([Math]::Max(14, $size * 0.4))" font-family="sans-serif" font-weight="bold">SC</text>
</svg>
"@
    $svgPath = "$iconsDir\icon-${size}x${size}.svg"
    Set-Content -LiteralPath $svgPath -Value $svgContent
    Write-Host "  Generated icon-${size}x${size}.svg" -ForegroundColor Gray
}

# Also create PNG placeholders (copy SVG for now - real PNGs should be used)
foreach ($size in $iconSizes) {
    $pngPath = "$iconsDir\icon-${size}x${size}.png"
    if (-not (Test-Path $pngPath)) {
        Copy-Item "$iconsDir\icon-${size}x${size}.svg" $pngPath
    }
}

# Screenshots directory
$screenshotsDir = "$ProjectRoot\public\screenshots"
if (-not (Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir -Force | Out-Null
}

Write-Host "  Icons generated in $iconsDir" -ForegroundColor Green

# Step 6: Create .env.local if not exists
Write-Host "[6/6] Checking environment configuration..." -ForegroundColor Yellow
$envFile = "$ProjectRoot\.env.local"
if (-not (Test-Path $envFile)) {
    @"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PromptPay
PROMPTPAY_MIN_AMOUNT=1.00
PROMPTPAY_DEFAULT_MERCHANT_ID=000000000000000

# Line Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SilverCare Thailand
"@ | Out-File -LiteralPath $envFile -Encoding UTF8
    Write-Host "  Created .env.local - update with your credentials" -ForegroundColor Green
} else {
    Write-Host "  .env.local already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Update .env.local with your Supabase and API credentials" -ForegroundColor Gray
Write-Host "  2. Run 'npm run dev' to start development server" -ForegroundColor Gray
Write-Host "  3. Run 'npm run bubblewrap:build' to generate Android AAB" -ForegroundColor Gray
Write-Host "  4. Run 'npm run playwright:upload' to auto-upload to Google Play" -ForegroundColor Gray
Write-Host ""
