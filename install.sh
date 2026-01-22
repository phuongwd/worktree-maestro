#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Worktree Maestro Installer${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude Code CLI is not installed${NC}"
    exit 1
fi

# Check for package manager
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
else
    echo -e "${RED}Error: No package manager found (pnpm or npm)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js installed${NC}"
echo -e "${GREEN}✓ Claude Code CLI installed${NC}"
echo -e "${GREEN}✓ Package manager: ${PKG_MANAGER}${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
cd "$SCRIPT_DIR"
$PKG_MANAGER install --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build
echo -e "${YELLOW}Building...${NC}"
$PKG_MANAGER run build --silent
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Add MCP server
echo -e "${YELLOW}Adding MCP server to Claude Code...${NC}"

# Remove existing if present (ignore errors)
claude mcp remove worktree-maestro -s user 2>/dev/null || true

# Add new
claude mcp add --scope user worktree-maestro -- node "$SCRIPT_DIR/dist/index.js"
echo -e "${GREEN}✓ MCP server added${NC}"
echo ""

# Copy skills
echo -e "${YELLOW}Installing skills...${NC}"
SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"

# Copy each skill
for skill_dir in "$SCRIPT_DIR/skills"/*/; do
    skill_name=$(basename "$skill_dir")
    target_dir="$SKILLS_DIR/$skill_name"

    # Remove existing
    rm -rf "$target_dir"

    # Copy new
    cp -r "$skill_dir" "$target_dir"
    echo -e "  ${GREEN}✓${NC} /$(basename "$skill_dir")"
done

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Please ${YELLOW}restart Claude Code${NC} to load the changes."
echo ""
echo -e "Available commands:"
echo -e "  ${BLUE}/wt${NC}           - List worktrees"
echo -e "  ${BLUE}/wt-create${NC}    - Create worktree"
echo -e "  ${BLUE}/wt-switch${NC}    - Switch to worktree"
echo -e "  ${BLUE}/wt-clean${NC}     - Remove worktree"
echo -e "  ${BLUE}/wt-pr${NC}        - Create PR"
echo -e "  ${BLUE}/wt-config${NC}    - Configuration"
echo ""
