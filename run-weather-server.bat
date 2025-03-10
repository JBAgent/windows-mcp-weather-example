@echo off
echo Starting Weather MCP Server for Claude Desktop...
echo.
echo Make sure Claude Desktop is running and you've allowed MCP permissions.
echo.
echo Press Ctrl+C to stop the server when finished.
echo.

node build/index.js

echo.
echo Weather MCP Server stopped.
pause
