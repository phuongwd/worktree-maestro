#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Worktree Maestro Uninstaller${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Remove MCP server
echo -e "${YELLOW}Removing MCP server...${NC}"
claude mcp remove worktree-maestro -s user 2>/dev/null && \
    echo -e "${GREEN}✓ MCP server removed${NC}" || \
    echo -e "${YELLOW}⚠ MCP server not found (already removed?)${NC}"

# Remove skills
echo -e "${YELLOW}Removing skills...${NC}"
SKILLS_DIR="$HOME/.claude/skills"

for skill in wt wt-create wt-switch wt-clean wt-pr wt-config; do
    if [ -d "$SKILLS_DIR/$skill" ]; then
        rm -rf "$SKILLS_DIR/$skill"
        echo -e "  ${GREEN}✓${NC} Removed /$skill"
    fi
done

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Uninstall Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Please ${YELLOW}restart Claude Code${NC} to apply changes."
echo ""
echo -e "${YELLOW}Note:${NC} Config and state files are preserved at:"
echo -e "  ~/.worktree-maestro/"
echo ""
echo -e "To remove all data: ${RED}rm -rf ~/.worktree-maestro${NC}"
echo ""
