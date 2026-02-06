#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Instalador opencode-obsidian${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Detectar directorio actual
INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${BLUE}📁 Directorio de instalación:${NC} $INSTALL_DIR"

# Verificar Node.js
echo -e "${BLUE}🔍 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js detectado:${NC} $NODE_VERSION"

# Verificar npm
echo -e "${BLUE}🔍 Verificando npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm detectado${NC}"

echo ""
echo -e "${YELLOW}⚙️  Configuración${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Preguntar ubicación del vault
echo -n "¿Dónde quieres crear tu vault? [~/opencode-vault]: "
read VAULT_PATH
VAULT_PATH=${VAULT_PATH:-~/opencode-vault}

# Expandir ~ a $HOME
VAULT_PATH="${VAULT_PATH/#\~/$HOME}"

# Preguntar ubicación de opencode config
if [ -f "$HOME/.config/opencode/opencode.json" ]; then
    OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"
elif [ -f "$HOME/.opencode/opencode.json" ]; then
    OPENCODE_CONFIG="$HOME/.opencode/opencode.json"
else
    OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"
fi

echo -n "¿Dónde está tu opencode.json? [$OPENCODE_CONFIG]: "
read OPENCODE_CONFIG_INPUT
OPENCODE_CONFIG=${OPENCODE_CONFIG_INPUT:-$OPENCODE_CONFIG}
OPENCODE_CONFIG="${OPENCODE_CONFIG/#\~/$HOME}"

# Preguntar sobre templates
echo -n "¿Copiar templates compartidos? [Y/n]: "
read COPY_TEMPLATES
COPY_TEMPLATES=${COPY_TEMPLATES:-Y}

echo ""
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$INSTALL_DIR/mcp-server" || exit 1

# Instalar dependencias
echo -e "${BLUE}⏳ npm install (esto puede tomar unos minutos)...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias instaladas${NC}"

# Compilar
echo ""
echo -e "${YELLOW}🔨 Compilando proyecto...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error compilando proyecto${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Proyecto compilado${NC}"

# Crear vault
echo ""
echo -e "${YELLOW}📁 Creando vault...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$VAULT_PATH"
mkdir -p "$VAULT_PATH/inbox"
mkdir -p "$VAULT_PATH/entregas"
mkdir -p "$VAULT_PATH/tracking"
mkdir -p "$VAULT_PATH/daily"
mkdir -p "$VAULT_PATH/recursos"
mkdir -p "$VAULT_PATH/proyectos"
mkdir -p "$VAULT_PATH/templates"

# Copiar templates
if [[ $COPY_TEMPLATES =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📄 Copiando templates...${NC}"
    cp -r "$INSTALL_DIR/skill-opencode-obsidian/templates/"* "$VAULT_PATH/templates/"
    echo -e "${GREEN}✅ Templates copiados${NC}"
fi

# Copiar README al vault
cp "$INSTALL_DIR/README.md" "$VAULT_PATH/"

echo -e "${GREEN}✅ Vault creado en:${NC} $VAULT_PATH"

# Configurar opencode
echo ""
echo -e "${YELLOW}⚙️  Configurando opencode...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Crear directorio si no existe
mkdir -p "$(dirname "$OPENCODE_CONFIG")"

# Configuración MCP (usar ruta absoluta)
MCP_CONFIG=$(cat <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode-obsidian": {
      "command": ["node", "$INSTALL_DIR/mcp-server/dist/index.js"],
      "enabled": true
    }
  }
}
EOF
)

if [ -f "$OPENCODE_CONFIG" ]; then
    # Backup
    cp "$OPENCODE_CONFIG" "$OPENCODE_CONFIG.backup.$(date +%Y%m%d%H%M%S)"
    
    # Verificar si ya tiene configuración MCP
    if grep -q "opencode-obsidian" "$OPENCODE_CONFIG"; then
        echo -e "${YELLOW}⚠️  MCP ya configurado, actualizando...${NC}"
        # Aquí podríamos usar jq para actualizar, pero por simplicidad solo informamos
        echo -e "${YELLOW}ℹ️  Por favor verifica manualmente la configuración en:${NC} $OPENCODE_CONFIG"
    else
        # Agregar configuración MCP
        echo "," >> "$OPENCODE_CONFIG"
        echo "$MCP_CONFIG" >> "$OPENCODE_CONFIG"
        echo -e "${GREEN}✅ Configuración MCP agregada${NC}"
    fi
else
    # Crear nuevo archivo
    echo "$MCP_CONFIG" > "$OPENCODE_CONFIG"
    echo -e "${GREEN}✅ Configuración creada${NC}"
fi

# Instalar skill
SKILL_DIR="$HOME/.config/opencode/skills"
mkdir -p "$SKILL_DIR"

if [ -L "$SKILL_DIR/opencode-obsidian" ]; then
    rm "$SKILL_DIR/opencode-obsidian"
fi

ln -s "$INSTALL_DIR/skill-opencode-obsidian" "$SKILL_DIR/opencode-obsidian"
echo -e "${GREEN}✅ Skill instalado${NC}"

# Resumen
echo ""
echo -e "${GREEN}🎉 ¡Instalación completada!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📁 Vault:${NC} $VAULT_PATH"
echo -e "${BLUE}⚙️  Configuración:${NC} $OPENCODE_CONFIG"
echo ""
echo -e "${YELLOW}🚀 Próximos pasos:${NC}"
echo "1. Reinicia opencode"
echo "2. Ejecuta: /templates"
echo "3. Empieza a usar: /c 'tu nota aquí'"
echo ""
echo -e "${BLUE}📚 Documentación:${NC}"
echo "- README.md: Guía completa"
echo "- CHEATSHEET.md: Comandos rápidos"
echo "- OBSIDIAN_INTEGRATION.md: Integración con Obsidian"
echo ""
