# 问题摘要：Chat 默认 Agent 未注册

## 核心问题

OpenVSCode Server 的 Chat 功能无法使用，错误：`No default chat agent available. Please ensure a chat agent is configured.`

## 根本原因

**`product.json` 中缺少 `defaultChatAgent` 配置**，导致：
1. `ChatEntitlementService` 提前返回，不初始化 `context`
2. `ChatSetupContribution` 无法注册默认 agents
3. 所有模式（Agent/Ask/Edit）都没有可用的 agent

## 关键代码位置

1. **错误抛出**: `chatServiceImpl.ts:652-655`
2. **Entitlement 检查**: `chatEntitlementService.ts:282-284` - `if (!productService.defaultChatAgent) return;`
3. **Agent 注册**: `chatSetup.ts:924-928` - 依赖 `context` 存在

## 需要回答的问题

1. OpenVSCode Server 是否应该配置 `defaultChatAgent`？
2. 如果不配置，代码是否需要修改以支持无 `defaultChatAgent` 的情况？
3. 是否有替代方案（如匿名访问模式）？

## 详细报告

完整的问题分析请查看：`docs/问题报告-默认Agent未注册.md`

