#!/bin/bash

# Setup script for opencode-obsidian
# This script installs and configures the MCP server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 opencode-obsidian Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd "$SCRIPT_DIR/mcp-server"
npm install

# Build
echo ""
echo "🔨 Building project..."
npm run build
echo "✅ Build complete"

# Create global link
echo ""
echo "🔗 Creating global link..."
npm link
echo "✅ Global link created"

# Configure opencode.json
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"
CONFIG_DIR="$(dirname "$OPENCODE_CONFIG")"
mkdir -p "$CONFIG_DIR"

# Convert path for JSON (forward slashes)
MCP_PATH="$(echo "$SCRIPT_DIR/mcp-server/dist/index.js" | sed 's/\\/\//g')"

if [ -f "$OPENCODE_CONFIG" ]; then
    if grep -q '"opencode-obsidian"' "$OPENCODE_CONFIG"; then
        echo "✅ MCP already configured"
    else
        echo "⚠️  Add this to your opencode.json:"
        echo ""
        echo '"mcp": {'
        echo '  "opencode-obsidian": {'
        echo '    "command": ["node", "'"$MCP_PATH"'"],'
        echo '    "enabled": true'
        echo '  }'
        echo '}'
    fi
else
    cat > "$OPENCODE_CONFIG" <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode-obsidian": {
      "command": ["node", "$MCP_PATH"],
      "enabled": true
    }
  }
}
EOF
    echo "✅ Created opencode.json"
fi

# Install skill
echo ""
echo "📚 Installing skill..."
SKILL_DIR="$HOME/.config/opencode/skills"
mkdir -p "$SKILL_DIR"

if [ -L "$SKILL_DIR/opencode-obsidian" ] || [ -d "$SKILL_DIR/opencode-obsidian" ]; then
    rm -rf "$SKILL_DIR/opencode-obsidian"
fi

ln -s "$SCRIPT_DIR/skill-opencode-obsidian" "$SKILL_DIR/opencode-obsidian"
echo "✅ Skill installed"

# Summary
echo ""
echo "🎉 Installation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your vault:"
echo "   oo-setup setup"
echo ""
echo "2. Restart opencode"
echo ""
echo "3. Verify installation:"
echo "   >oo status"
echo ""
