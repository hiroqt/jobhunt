#!/usr/bin/env bash
python3 -c "
import json, os, sys

if sys.platform == 'darwin':
    config_dir = os.path.expanduser('~/Library/Application Support/Claude')
elif sys.platform == 'win32':
    config_dir = os.path.expandvars('%APPDATA%/Claude')
else:
    config_dir = os.path.expanduser('~/.config/Claude')

os.makedirs(config_dir, exist_ok=True)
config_file = os.path.join(config_dir, 'claude_desktop_config.json')

data = {}
if os.path.exists(config_file):
    try:
        with open(config_file, 'r') as f:
            data = json.load(f)
    except Exception:
        data = {}

if 'mcpServers' not in data:
    data['mcpServers'] = {}

data['mcpServers']['sakto-ka'] = {
    'command': 'npx',
    'args': ['-y', 'mcp-remote', 'https://jobhunt-1e11.onrender.com/mcp/sse']
}

with open(config_file, 'w') as f:
    json.dump(data, f, indent=2)

print('✓ Successfully configured Sakto Ka MCP in Claude Desktop!')
print('Config file: ' + config_file)
print('Please restart Claude Desktop to load the tools.')
"
