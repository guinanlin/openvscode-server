#!/usr/bin/env bash
# shellcheck disable=SC2034
# allow-any-unicode-in-file

# OpenVSCode Server 中文语言包安装脚本
# 使用方法：./scripts/install-chinese-language-pack.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}OpenVSCode Server 中文语言包安装脚本${NC}"
echo "=========================================="

# 检测 OpenVSCode Server 可执行文件
OPENVSCODE_BIN=""

# 方法 1: 检查打包后的二进制文件
if [ -f "../vscode-reh-web-linux-x64/bin/openvscode-server" ]; then
	OPENVSCODE_BIN="../vscode-reh-web-linux-x64/bin/openvscode-server"
	echo -e "${GREEN}找到打包后的二进制文件${NC}"
# 方法 2: 检查开发环境的脚本
elif [ -f "./scripts/code-server.sh" ]; then
	# 使用开发环境的 node 来运行
	OPENVSCODE_BIN="node"
	OPENVSCODE_SCRIPT="./out/server-cli.js"
	echo -e "${YELLOW}使用开发环境${NC}"
else
	echo -e "${RED}错误：找不到 OpenVSCode Server 可执行文件${NC}"
	echo "请确保："
	echo "1. 在项目根目录运行此脚本"
	echo "2. 或者已经打包了生产版本（vscode-reh-web-linux-x64）"
	exit 1
fi

# 语言包扩展 ID
LANG_PACK_ID="MS-CEINTL.vscode-language-pack-zh-hans"

echo ""
echo -e "${YELLOW}正在安装中文语言包...${NC}"
echo "扩展 ID: ${LANG_PACK_ID}"
echo ""

# 安装扩展
if [ -n "$OPENVSCODE_SCRIPT" ]; then
	# 开发环境
	$OPENVSCODE_BIN $OPENVSCODE_SCRIPT --install-extension "$LANG_PACK_ID" || {
	    echo -e "${RED}安装失败！${NC}"
	    echo ""
	    echo "可能的原因："
	    echo "1. OpenVSX 扩展市场中没有该语言包"
	    echo "2. 网络连接问题"
	    echo "3. 需要先编译项目（运行 npm run compile）"
	    echo ""
	    echo "请尝试手动安装："
	    echo "1. 访问 https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans"
	    echo "2. 下载 .vsix 文件"
	    echo "3. 在 OpenVSCode Server 中：Ctrl+Shift+P → Extensions: Install from VSIX..."
	    exit 1
	}
else
	# 生产环境
	$OPENVSCODE_BIN --install-extension "$LANG_PACK_ID" || {
	    echo -e "${RED}安装失败！${NC}"
	    echo ""
	    echo "可能的原因："
	    echo "1. OpenVSX 扩展市场中没有该语言包"
	    echo "2. 网络连接问题"
	    echo ""
	    echo "请尝试手动安装："
	    echo "1. 访问 https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans"
	    echo "2. 下载 .vsix 文件"
	    echo "3. 在 OpenVSCode Server 中：Ctrl+Shift+P → Extensions: Install from VSIX..."
	    exit 1
	}
fi

echo ""
echo -e "${GREEN}✓ 语言包安装成功！${NC}"
echo ""
echo "下一步操作："
echo "1. 打开 OpenVSCode Server Web 界面"
echo "2. 按 Ctrl+Shift+P 打开命令面板"
echo "3. 输入并选择：Configure Display Language"
echo "4. 选择：中文(简体) 或 zh-cn"
echo "5. 点击 'Restart' 按钮重启服务器"
echo ""
echo -e "${YELLOW}注意：必须重启服务器才能生效！${NC}"

