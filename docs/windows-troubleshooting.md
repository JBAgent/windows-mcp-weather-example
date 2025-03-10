# Windows Troubleshooting Guide for MCP Servers

This document provides solutions to common issues when running MCP servers on Windows with Claude Desktop.

## Common Issues and Solutions

### 1. Connection Issues

If Claude Desktop doesn't detect your MCP server:

- **Ensure Claude Desktop is Running First**: Always start Claude Desktop before starting the MCP server
- **Check Permissions**: Make sure you've clicked "Allow" when Claude asks for permission to use MCP
- **Restart Both**: Try closing both Claude Desktop and the MCP server, then restart Claude first, then the server

### 2. Path Issues

If you see "command not found" errors:

- **Check Node.js Installation**: Ensure Node.js is properly installed and in your system PATH
- **Run from Project Directory**: Make sure you're running the scripts from the project root directory
- **Use Full Paths**: Try using absolute paths in command arguments

### 3. Permission Errors

Windows security can sometimes block processes:

- **Run as Administrator**: Try running Command Prompt or PowerShell as Administrator
- **Check Windows Defender**: Temporarily disable Windows Defender or add exclusions
- **Check Firewall**: Ensure Windows Firewall isn't blocking the connection

### 4. Error Logs

If you encounter errors:

- **Check Log File**: Look at `weather-server.log` in the project directory
- **Console Output**: Check the console for error messages
- **Turn on Node Debugging**: Set `NODE_DEBUG=*` environment variable before running

### 5. Claude Desktop Integration

Specific Claude Desktop integration issues:

- **Permissions Reset**: Claude needs permission granted for MCP each time it's restarted
- **Tool Recognition**: Sometimes Claude may not immediately recognize the tools - try disconnecting and reconnecting
- **Multiple Servers**: Be careful when running multiple MCP servers simultaneously

## Advanced Debugging

For advanced debugging:

1. Set environmental variables to enable verbose logging:
   ```
   set DEBUG=mcp:*
   ```

2. Test basic connectivity with a simple echo:
   ```
   node -e "console.log('Testing pipe connection'); process.stdin.pipe(process.stdout);"
   ```

3. Check for process conflicts:
   ```
   netstat -ano | findstr "listening"
   ```

## Additional Resources

- [Official MCP Documentation](https://modelcontextprotocol.io)
- [Claude Desktop Support](https://support.anthropic.com)
- [Node.js Windows Documentation](https://nodejs.org/en/download/package-manager/#windows)
