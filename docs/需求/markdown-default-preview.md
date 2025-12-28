# 需求：Markdown 文件默认以渲染预览打开

## 概述

目前双击或打开 `.md` 文件时，默认打开的是源文件（可编辑的 Markdown 文本）。本需求要求将默认打开行为改为展示渲染后的 Markdown 预览（只读渲染视图），以提升阅读体验并减少误编辑。

## 目标用户

- 以阅读为主、偶尔编辑 Markdown 的用户；文档浏览者；课程/笔记查看者。

## 功能描述

- 在资源管理器中双击（或打开）`*.md` 文件时，工作台应优先使用渲染后的预览视图打开文件，而非源码编辑视图。
- 仍需提供进入源码编辑的方式（例如按钮、右键 → 打开源文件、在侧边打开等）。
- 预览应随源文件修改实时更新（自动刷新或监听保存/编辑事件）。
- 预览为只读（默认不允许直接编辑源），但允许侧边打开或通过命令切换到源码编辑器。

## 接受准则

1. 在默认工作区配置下，双击 `a.md` 会打开渲染预览（不是源码编辑器）。
2. 预览能够正确渲染标准 Markdown（标题、列表、代码块、图片、链接）。
3. 修改源码后，预览在短时间内同步更新（编辑或保存触发）。
4. 用户可通过右键菜单或命令显式“在侧边打开源文件”或“切换到源文件”。
5. 实现方式支持在不影响其他文件类型的情况下回退到原行为（可配置）。

## 实现方案（两种备选）

- 方案 A（配置优先，低侵入）：在工作区 `settings.json` 添加 editor association，将 `*.md` 关联到内置的 Markdown preview viewType（若当前分支/发行版支持）。优点：无需扩展，快速可回退。缺点：不同分支 preview viewType 名称可能不同。

- 方案 B（扩展实现，强控制力，推荐）：新增本地扩展（viewType 如 `markdown.defaultPreview`），注册 custom readonly editor provider，使用 `markdown-it` 或现有渲染器生成 Webview。将该 viewType 在 `package.json` 的 selector 绑定到 `*.md`。提供切换命令与右键菜单项以打开源文件。

## 推荐

- 先尝试方案 A 作为快速可交付项；若不可靠则实施方案 B 作为稳定实现并归档到内置扩展集合。

## 任务清单

- [ ] 在 `/workspaces/openvscode-server/.vscode/settings.json` 中尝试添加 editor association（方案 A）。
- [ ] 验证不同 viewType 名称（在当前代码树中搜索 preview 注册点）。
- [ ] 若方案 A 不可行，创建扩展模板 `/extensions/markdown-default-preview/`（`package.json` + `src/extension.ts`），实现自定义预览（方案 B）。
- [ ] 增加右键菜单项/命令以“在侧边打开源文件”并在 UI 中可见。
- [ ] 编写验收测试与手动验证步骤并更新文档。
- [ ] 提交 PR 并在 CI 下运行 TypeScript 编译检查。

## 相关文件 / 参考

- 工作区 settings: `.vscode/settings.json`
- 可能参考实现位置：`src/vs/workbench/contrib/markdown`（如存在）
- 示例扩展：docs 中的自定义编辑器示例

## 验证步骤（简短）

1. 应用设置或安装扩展并重启工作台/开发宿主（F5）。
2. 在资源管理器双击 `example.md`，应打开渲染预览。
3. 使用“在侧边打开源文件”确认可以编辑并保存；确认预览同步更新。

---

优先级：中（用户体验改进）

负责人：待指派
