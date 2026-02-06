#!/bin/bash

# Setup script for opencode-obsidian
# This script helps configure the MCP server and vault path

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_PATH="$SCRIPT_DIR/vault"
MCP_PATH="$SCRIPT_DIR/mcp-server/dist/index.js"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"

echo "🚀 Setting up opencode-obsidian..."
echo ""

# Check if npm dependencies are installed
if [ ! -d "$SCRIPT_DIR/mcp-server/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$SCRIPT_DIR/mcp-server"
    npm install
    npm run build
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if dist exists
if [ ! -f "$MCP_PATH" ]; then
    echo "🔨 Building project..."
    cd "$SCRIPT_DIR/mcp-server"
    npm run build
    echo "✅ Build complete"
fi

# Detect OS and set path format
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    # Windows - convert to forward slashes
    MCP_PATH_WINDOWS=$(echo "$MCP_PATH" | sed 's/\\/\//g' | sed 's/^\([A-Za-z]\):\//\/\L\1\//')
    MCP_CONFIG_PATH="$MCP_PATH_WINDOWS"
else
    # Unix/Linux/Mac
    MCP_CONFIG_PATH="$MCP_PATH"
fi

# Check if opencode config exists
if [ ! -f "$OPENCODE_CONFIG" ]; then
    echo "⚠️  Opencode config not found at $OPENCODE_CONFIG"
    echo "Creating config..."
    mkdir -p "$(dirname "$OPENCODE_CONFIG")"
    cat > "$OPENCODE_CONFIG" <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode-obsidian": {
      "type": "local",
      "command": "node",
      "args": ["$MCP_CONFIG_PATH"],
      "enabled": true
    }
  }
}
EOF
    echo "✅ Created opencode.json"
else
    # Check if mcp section already exists
    if grep -q '"opencode-obsidian"' "$OPENCODE_CONFIG"; then
        echo "✅ MCP config already exists"
    else
        echo "🔧 Adding MCP configuration..."
        # Create backup
        cp "$OPENCODE_CONFIG" "$OPENCODE_CONFIG.backup"
        
        # Use jq if available, otherwise manual sed
        if command -v jq &> /dev/null; then
            jq --arg path "$MCP_CONFIG_PATH" '.mcp = {"opencode-obsidian": {"type": "local", "command": "node", "args": [$path], "enabled": true}}' "$OPENCODE_CONFIG" > "$OPENCODE_CONFIG.tmp" && mv "$OPENCODE_CONFIG.tmp" "$OPENCODE_CONFIG"
        else
            # Manual insertion for systems without jq
            echo "⚠️  jq not found. Please manually add this to your opencode.json:"
            echo ''
            echo '"mcp": {'
            echo '  "opencode-obsidian": {'
            echo '    "type": "local",'
            echo '    "command": "node",'
            echo "    \"args\": [\"$MCP_CONFIG_PATH\"],"
            echo '    "enabled": true'
            echo '  }'
            echo '}'
            echo ''
            exit 0
        fi
        echo "✅ MCP configuration added"
    fi
fi

# Install skill
echo "📚 Installing skill..."
SKILL_DIR="$HOME/.config/opencode/skills"
if [ ! -d "$SKILL_DIR/opencode-obsidian" ]; then
    ln -s "$SCRIPT_DIR/skill-opencode-obsidian" "$SKILL_DIR/opencode-obsidian"
    echo "✅ Skill installed"
else
    echo "✅ Skill already installed"
fi

# Set environment variable
echo ""
echo "📝 Environment variable setup:"
echo ""
echo "Add this to your shell profile (.bashrc, .zshrc, or .bash_profile):"
echo ""
echo "export OBSIDIAN_VAULT_PATH=\"$VAULT_PATH\""
echo ""

# Detect shell
if [ -n "$BASH_VERSION" ]; then
    SHELL_PROFILE="~/.bashrc"
elif [ -n "$ZSH_VERSION" ]; then
    SHELL_PROFILE="~/.zshrc"
else
    SHELL_PROFILE="~/.bash_profile or ~/.profile"
fi

echo "Detected shell profile: $SHELL_PROFILE"
echo ""

# Offer to add automatically
read -p "Would you like me to add it automatically? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "export OBSIDIAN_VAULT_PATH=\"$VAULT_PATH\"" >> "${SHELL_PROFILE/#\~/$HOME}"
    echo "✅ Added to $SHELL_PROFILE"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart opencode or run: source $SHELL_PROFILE"
echo "2. Test with: obsidian_list_templates"
echo "3. Start capturing notes!"
echo ""
echo "Vault location: $VAULT_PATH"
echo "MCP server: $MCP_PATH"
