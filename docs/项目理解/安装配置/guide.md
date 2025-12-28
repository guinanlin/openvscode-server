以下是 **openvscode-server** 的完整开发步骤，我已将构建工具更新为 **npm**（不再使用 yarn）。所有命令都基于 npm，确保兼容性（npm 是官方推荐的替代方案之一）。

> 📖 **重要提示**：首次安装前，请先阅读 [安装配置指南](./installation-setup.md)，配置系统依赖和中国镜像源，以确保 `npm install` 能够成功执行。

### 1. 前提：克隆仓库
```bash
git clone https://github.com/gitpod-io/openvscode-server.git
cd openvscode-server
```

### 2. 安装依赖（使用 npm）
```bash
# 确保 Node.js 22.x（推荐 nvm use 22）
npm install
```

**首次安装前必须步骤：**
- 安装系统依赖（见 [安装配置指南](./installation-setup.md)）
- 配置中国镜像源（见 [安装配置指南](./installation-setup.md)）
- 配置 GitHub Token（推荐，见 [安装配置指南](./installation-setup.md)）

**注意**：如果遇到 `Cannot find module 'got'` 错误，运行：
```bash
npm install got --save-dev
```

### 3. 初始化项目（首次运行必须）
```bash
# 编译代码并下载内置扩展（首次启动必须执行）
npm run server:init
```
这一步会运行 `npm run compile && npm run download-builtin-extensions`，可能需要几分钟。

**注意**：编译过程需要大量内存（推荐至少 6GB 可用内存）。如果遇到 "JavaScript heap out of memory" 错误：

1. **如果系统内存充足**（>16GB），可以增加内存限制：
```bash
# 临时设置更高的内存限制（例如 8GB 或 12GB）
NODE_OPTIONS="--max-old-space-size=8192" npm run server:init
# 或
NODE_OPTIONS="--max-old-space-size=12288" npm run server:init
```

2. **如果系统内存有限**（4-8GB），可以降低内存限制（但编译会更慢）：
```bash
# 使用 4GB 内存限制（编译会更慢，但可以在小内存机器上运行）
NODE_OPTIONS="--max-old-space-size=4096" npm run server:init
```

3. **或者使用预编译的 Docker 镜像**（推荐小内存机器）：
```bash
docker run -it -p 3000:3000 -v "${PWD}:/home/workspace" gitpod/openvscode-server
```

### 4. 开发模式（日常开发推荐，热重载）

**步骤 1**：在第一个终端运行监视模式（保持运行）
```bash
export NODE_ENV=development
export VSCODE_DEV=1
npm run watch
```

**步骤 2**：在新终端启动服务器
```bash
export NODE_ENV=development
export VSCODE_DEV=1
./scripts/code-server.sh --without-connection-token --port 3000
```

或者使用 web 模式：
```bash
./scripts/code-web.sh --port 3000
```

- 浏览器打开：`http://localhost:3000`
- 修改代码后保存 → 自动重新编译 → 刷新浏览器生效。

### 5. 常见启动参数（根据需求加）
```bash
# 常用组合：禁用扩展 + 指定工作目录 + 无密码
./scripts/code-server.sh \
  --port 3000 \
  --without-connection-token \
  --disable-extensions \
  --folder-uri file:///path/to/your/project
```

### 6. 测试你的修改
- 打开项目文件夹 → Source Control 视图（Git 集成测试）。
- 编辑文件 → commit → push。
- 隐藏不需要的面板（如 Terminal）：启动时加 `--disable-extensions` 或修改代码 `src/vs/workbench/browser/parts/activitybar/activitybarPart.ts`。

### 7. 打包成生产版本（部署到服务器用）
```bash
# 生成 Linux x64 Web 版（最常用）
npm run gulp vscode-reh-web-linux-x64-min
```

- 打包后，在项目外一层目录出现 `vscode-reh-web-linux-x64` 文件夹。
- 运行生产版：
  ```bash
  ../vscode-reh-web-linux-x64/bin/openvscode-server --port 3000
  ```

其他平台：
```bash
npm run gulp vscode-reh-web-darwin-x64-min    # macOS
npm run gulp vscode-reh-web-win32-x64-min     # Windows
```

### 8. Docker 方式（推荐云部署/Sealos DevBox）
```bash
# 直接用官方镜像运行（最简单）
docker run -it -p 3000:3000 \
  -v "${PWD}:/home/workspace" \
  gitpod/openvscode-server
```

> 📦 **生产环境部署**：如需使用 Dokploy 或其他平台部署到生产环境，请参考 [生产环境部署指南](./production-deployment.md)。

### 9. 日常开发循环总结

**首次设置**：
1. `npm install`（安装依赖）
2. `npm run server:init`（编译代码和下载扩展）

**日常开发**：
1. 终端1：`export NODE_ENV=development && export VSCODE_DEV=1 && npm run watch`（监视模式）
2. 终端2：`export NODE_ENV=development && export VSCODE_DEV=1 && ./scripts/code-server.sh --without-connection-token --port 3000`（启动服务器）
3. 浏览器打开 http://localhost:3000 → 修改代码 → 保存 → 刷新
4. 测试 Git/编辑功能 → 满意后打包或 Docker 部署

**注意事项**：
- npm 命令与 yarn 等价（如 `npm run watch` 等同于 `yarn watch`）。
- 所有 gulp 任务（如 `vscode-reh-web-linux-x64-min`）都通过 `npm run gulp` 调用。
- 如果项目里有 `package.json` 中的 scripts 脚本，npm 会自动识别。

这样就完全切换到 npm 了！如果后续开发中遇到 npm 相关问题（比如依赖下载慢），可以加 `--registry=https://registry.npmmirror.com` 加速。需要进一步定制代码或配置吗？随时说！