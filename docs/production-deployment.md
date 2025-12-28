# OpenVSCode Server 生产环境部署指南

本文档提供使用 Dokploy 部署 OpenVSCode Server 到生产环境的完整方案。

## 部署方案概览

根据你的需求，有以下三种部署方案：

1. **方案一：使用官方 Docker 镜像**（推荐，最简单）
2. **方案二：构建自定义 Docker 镜像**（需要自定义配置）
3. **方案三：使用打包后的二进制文件**（适合非容器化部署）

---

## 方案一：使用官方 Docker 镜像（推荐）

这是最简单快速的部署方式，适合大多数场景。

### 1. 在 Dokploy 中创建应用

**应用配置：**
- **应用名称**：`openvscode-server`
- **镜像**：`gitpod/openvscode-server:latest`（或指定版本如 `gitpod/openvscode-server:1.106.0`）
- **端口映射**：`3000:3000`
- **环境变量**：
  ```
  PORT=3000
  ```

### 2. 数据卷配置

**必需卷：**
- **工作目录挂载**：
  - 主机路径：`/path/to/workspace`（你的项目目录）
  - 容器路径：`/home/workspace`
  - 类型：`bind` 或 `volume`

**可选卷（持久化用户数据）：**
- **扩展和配置**：
  - 容器路径：`/home/.openvscode-server`
  - 类型：`volume`
  - 名称：`openvscode-server-data`

### 3. 启动命令（可选）

如果需要自定义启动参数，可以在 Dokploy 的启动命令中设置：

```bash
--without-connection-token --port 3000 --host 0.0.0.0
```

### 4. 完整 Dokploy 配置示例

**Docker Compose 格式（Dokploy 支持）：**

```yaml
version: '3.8'

services:
  openvscode-server:
    image: gitpod/openvscode-server:latest
    container_name: openvscode-server
    ports:
      - "3000:3000"
    volumes:
      # 工作目录（必需）
      - /path/to/your/workspace:/home/workspace:cached
      # 用户数据和扩展（可选，持久化）
      - openvscode-server-data:/home/.openvscode-server
    environment:
      - PORT=3000
    restart: unless-stopped
    # 如果需要自定义启动参数
    command: --without-connection-token --port 3000 --host 0.0.0.0

volumes:
  openvscode-server-data:
```

### 5. 访问应用

部署完成后，访问：`http://your-server-ip:3000`

---

## 方案二：构建自定义 Docker 镜像

如果你需要预装扩展、自定义配置或使用自己编译的版本，可以使用此方案。

### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile.production`：

```dockerfile
# 使用官方镜像作为基础
FROM gitpod/openvscode-server:latest

# 切换到 root 用户以安装依赖
USER root

# 安装系统依赖（如果需要）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # 在这里添加你需要的系统包
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 设置环境变量
ENV OPENVSCODE_SERVER_ROOT="/home/.openvscode-server"
ENV OPENVSCODE="${OPENVSCODE_SERVER_ROOT}/bin/openvscode-server"

# 预安装 VSCode 扩展（可选）
# 示例：安装 Python 和 GitLens 扩展
RUN ${OPENVSCODE} --install-extension ms-python.python && \
    ${OPENVSCODE} --install-extension eamodio.gitlens

# 恢复默认用户
USER openvscode-server

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["--without-connection-token", "--port", "3000", "--host", "0.0.0.0"]
```

### 2. 构建镜像

```bash
# 在项目根目录执行
docker build -f Dockerfile.production -t openvscode-server:custom .
```

### 3. 推送到镜像仓库（可选）

```bash
# 标记镜像
docker tag openvscode-server:custom your-registry/openvscode-server:custom

# 推送镜像
docker push your-registry/openvscode-server:custom
```

### 4. 在 Dokploy 中使用自定义镜像

在 Dokploy 中创建应用时，使用你构建的镜像名称：
- **镜像**：**`openvscode-server:custom`** 或 **`your-registry/openvscode-server:custom`**

其他配置与方案一相同。

---

## 方案三：从源码构建并打包（高级）

如果你需要完全自定义的构建，可以从源码编译并打包。

### 1. 构建生产版本

```bash
# 在开发环境中执行
cd /home/devbox/project/openvscode-server

# 确保已安装依赖
npm install

# 编译并打包（需要大量内存和时间）
npm run gulp vscode-reh-web-linux-x64-min
```

打包完成后，会在项目上级目录生成 `vscode-reh-web-linux-x64` 文件夹。

### 2. 创建生产 Dockerfile

创建 `Dockerfile.binary`：

```dockerfile
FROM node:22-slim

# 安装运行时依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 复制打包后的二进制文件
COPY ../vscode-reh-web-linux-x64 /app/openvscode-server

# 设置权限
RUN chmod +x /app/openvscode-server/bin/openvscode-server

# 创建用户
RUN useradd -m -s /bin/bash openvscode-server && \
    chown -R openvscode-server:openvscode-server /app

USER openvscode-server

# 暴露端口
EXPOSE 3000

# 启动命令
WORKDIR /app/openvscode-server
CMD ["./bin/openvscode-server", "--without-connection-token", "--port", "3000", "--host", "0.0.0.0"]
```

### 3. 构建并部署

```bash
# 构建镜像
docker build -f Dockerfile.binary -t openvscode-server:built .

# 在 Dokploy 中使用此镜像
```

---

## Dokploy 部署步骤详解

### 步骤 1：准备镜像

选择上述方案之一，确保镜像可用：
- 方案一：直接使用 `gitpod/openvscode-server:latest`
- 方案二：构建并推送自定义镜像
- 方案三：从源码构建并创建镜像

### 步骤 2：在 Dokploy 中创建应用

1. 登录 Dokploy 管理界面
2. 点击 "Applications" → "New Application"
3. 填写应用信息：
   - **Name**: `openvscode-server`
   - **Image**: 选择你的镜像（如 `gitpod/openvscode-server:latest`）
   - **Port**: `3000`

### 步骤 3：配置卷（Volumes）

**必需卷：**
- **工作目录**：
  - Type: `Bind Mount` 或 `Volume`
  - Host Path: `/path/to/workspace`（你的实际工作目录）
  - Container Path: `/home/workspace`

**推荐卷（持久化）：**
- **用户数据**：
  - Type: `Volume`
  - Volume Name: `openvscode-server-data`
  - Container Path: `/home/.openvscode-server`

### 步骤 4：配置环境变量

```
PORT=3000
```

### 步骤 5：配置启动命令（可选）

如果需要自定义启动参数：

```bash
--without-connection-token --port 3000 --host 0.0.0.0
```

### 步骤 6：配置网络

- **端口映射**：`3000:3000`
- 如果需要 HTTPS，可以在 Dokploy 中配置反向代理（Nginx/Traefik）

### 步骤 7：配置重启策略

- **Restart Policy**: `unless-stopped` 或 `always`

### 步骤 8：部署

点击 "Deploy" 按钮，等待容器启动。

---

## 安全建议

### 1. 启用连接令牌（生产环境推荐）

生产环境建议使用连接令牌而不是 `--without-connection-token`：

```bash
# 生成随机令牌
TOKEN=$(openssl rand -hex 16)

# 启动时使用令牌
--connection-token ${TOKEN}
```

访问地址会变成：`http://your-server:3000?tkn=${TOKEN}`

### 2. 使用 HTTPS

在 Dokploy 中配置反向代理，使用 Let's Encrypt 证书：

- 配置域名
- 启用 HTTPS
- 将 HTTP 流量重定向到 HTTPS

### 3. 限制访问

- 使用防火墙规则限制 IP 访问
- 配置 Nginx/Traefik 的访问控制
- 考虑使用 VPN 或内网访问

### 4. 资源限制

在 Dokploy 中设置资源限制：
- **CPU**: 建议至少 2 核
- **内存**: 建议至少 4GB（编译需要更多）

---

## 性能优化

### 1. 使用缓存卷

将扩展和用户数据存储在持久化卷中，避免每次重启重新下载。

### 2. 资源限制

在 Dokploy 中设置合理的资源限制，避免资源耗尽。

### 3. 多实例部署（可选）

如果需要高可用，可以部署多个实例并使用负载均衡。

---

## 常见问题

### Q1: 容器启动后无法访问？

**检查项：**
1. 确认端口映射正确（`3000:3000`）
2. 确认防火墙规则允许 3000 端口
3. 查看容器日志：`docker logs openvscode-server`
4. 确认启动命令包含 `--host 0.0.0.0`

### Q2: 工作目录无法访问？

**解决方案：**
1. 检查卷挂载路径是否正确
2. 确认文件权限（容器用户是否有读取权限）
3. 使用 `cached` 挂载选项提高性能

### Q3: 扩展无法安装？

**解决方案：**
1. 检查网络连接
2. 确认 `/home/.openvscode-server` 目录有写入权限
3. 查看容器日志中的错误信息

### Q4: 内存不足？

**解决方案：**
1. 增加容器内存限制（至少 4GB）
2. 如果从源码构建，使用预编译镜像
3. 关闭不必要的扩展

---

## 推荐配置总结

**最简单的生产部署（推荐）：**

```yaml
# docker-compose.yml
version: '3.8'

services:
  openvscode-server:
    image: gitpod/openvscode-server:latest
    ports:
      - "3000:3000"
    volumes:
      - /workspace:/home/workspace:cached
      - openvscode-data:/home/.openvscode-server
    environment:
      - PORT=3000
    restart: unless-stopped
    command: --without-connection-token --port 3000 --host 0.0.0.0
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

volumes:
  openvscode-data:
```

---

## 下一步

部署成功后，你可以：
1. 访问 Web 界面开始使用
2. 安装需要的扩展
3. 配置 Git 凭据
4. 设置工作区设置

如有问题，请查看 [快速启动指南](./quick-start.md) 或 [开发指南](./guide.md)。

