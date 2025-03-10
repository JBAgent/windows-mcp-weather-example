# PowerShell script to run the Weather MCP Server

Write-Host "Starting Weather MCP Server for Claude Desktop..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure Claude Desktop is running and you've allowed MCP permissions." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server when finished." -ForegroundColor Yellow
Write-Host ""

try {
    # Check if Node.js is installed
    $nodeVersion = node --version
    Write-Host "Using Node.js $nodeVersion" -ForegroundColor Cyan
    
    # Check if the build directory exists
    if (-not (Test-Path -Path ".\build\index.js")) {
        Write-Host "Error: Build files not found. Run 'npm run build' first." -ForegroundColor Red
        exit 1
    }
    
    # Run the server
    node build/index.js
} 
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*node*") {
        Write-Host "Node.js may not be installed or not in your PATH. Please install Node.js and try again." -ForegroundColor Red
    }
    
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Weather MCP Server stopped." -ForegroundColor Green
Read-Host "Press Enter to exit"
