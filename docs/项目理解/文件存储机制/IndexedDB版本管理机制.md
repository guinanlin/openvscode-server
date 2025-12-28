# IndexedDB 版本管理机制详解

## 概述

本文档深入分析 OpenVSCode Server 项目中 IndexedDB 的版本管理机制，包括版本号管理、数据库升级策略、结构验证、错误恢复以及数据迁移机制。

---

## 一、版本管理核心机制

### 1. 版本号指定

IndexedDB 使用版本号来标识数据库结构。在 OpenVSCode Server 中，版本号在创建数据库时显式指定：

```typescript
// 文件系统数据库：显式指定版本号 3
IndexedDB.create('vscode-web-db', 3, [
    'vscode-userdata-store',
    'vscode-logs-store',
    'vscode-filehandles-store'
])

// 存储服务数据库：使用 undefined（自动版本管理）
IndexedDB.create('vscode-web-state-db-global', undefined, [
    'ItemTable'
])
```

**版本号的作用：**
- 标识数据库结构的版本
- 触发数据库升级流程
- 确保数据库结构与代码期望一致

### 2. 数据库结构定义

**文件系统数据库（vscode-web-db）：**
- **版本**：3
- **Object Stores**：
  - `vscode-userdata-store`：用户数据存储
  - `vscode-logs-store`：日志数据存储
  - `vscode-filehandles-store`：文件句柄存储

**存储服务数据库（vscode-web-state-db-*）：**
- **版本**：undefined（自动管理）
- **Object Stores**：
  - `ItemTable`：键值对存储

---

## 二、数据库升级机制

### 1. 升级触发条件

IndexedDB 的升级机制在以下情况下触发：

1. **版本号增加**：当代码中指定的版本号大于现有数据库版本时
2. **首次创建**：数据库不存在时，创建新数据库
3. **结构不匹配**：现有数据库缺少必需的 object stores

### 2. 升级流程实现

升级流程在 `IndexedDB.doOpenDatabase()` 方法中实现：

```55:78:openvscode-server/src/vs/base/browser/indexedDB.ts
	private static doOpenDatabase(name: string, version: number | undefined, stores: string[]): Promise<IDBDatabase> {
		return new Promise((c, e) => {
			const request = indexedDB.open(name, version);
			request.onerror = () => e(request.error);
			request.onsuccess = () => {
				const db = request.result;
				for (const store of stores) {
					if (!db.objectStoreNames.contains(store)) {
						console.error(`Error while opening IndexedDB. Could not find '${store}'' object store`);
						e(new MissingStoresError(db));
						return;
					}
				}
				c(db);
			};
			request.onupgradeneeded = () => {
				const db = request.result;
				for (const store of stores) {
					if (!db.objectStoreNames.contains(store)) {
						db.createObjectStore(store);
					}
				}
			};
		});
	}
```

**升级流程步骤：**

1. **打开数据库**：`indexedDB.open(name, version)`
2. **触发升级事件**：如果版本号增加，触发 `onupgradeneeded` 事件
3. **创建缺失的 Stores**：在 `onupgradeneeded` 中创建所有必需的 object stores
4. **验证结构**：在 `onsuccess` 中验证所有 stores 是否存在
5. **返回数据库**：如果验证通过，返回数据库实例

### 3. 升级事件处理

```typescript
request.onupgradeneeded = () => {
    const db = request.result;
    for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) {
            // 创建缺失的 object store
            db.createObjectStore(store);
        }
    }
};
```

**关键特性：**
- **幂等性**：如果 store 已存在，不会重复创建
- **自动创建**：只创建缺失的 stores，不影响已存在的 stores
- **无数据迁移**：当前实现不包含数据迁移逻辑

---

## 三、结构验证机制

### 1. 验证时机

数据库打开成功后，立即验证结构：

```typescript
request.onsuccess = () => {
    const db = request.result;
    // 验证所有必需的 stores 是否存在
    for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) {
            console.error(`Error while opening IndexedDB. Could not find '${store}'' object store`);
            e(new MissingStoresError(db));
            return;
        }
    }
    c(db);
};
```

### 2. 验证失败处理

如果验证失败（缺少必需的 stores），系统会：

1. **抛出错误**：抛出 `MissingStoresError` 异常
2. **捕获错误**：在 `openDatabase()` 方法中捕获
3. **删除数据库**：删除整个数据库
4. **重建数据库**：重新创建数据库

```30:52:openvscode-server/src/vs/base/browser/indexedDB.ts
	private static async openDatabase(name: string, version: number | undefined, stores: string[]): Promise<IDBDatabase> {
		mark(`code/willOpenDatabase/${name}`);
		try {
			return await IndexedDB.doOpenDatabase(name, version, stores);
		} catch (err) {
			if (err instanceof MissingStoresError) {
				console.info(`Attempting to recreate the IndexedDB once.`, name);

				try {
					// Try to delete the db
					await IndexedDB.deleteDatabase(err.db);
				} catch (error) {
					console.error(`Error while deleting the IndexedDB`, getErrorMessage(error));
					throw error;
				}

				return await IndexedDB.doOpenDatabase(name, version, stores);
			}

			throw err;
		} finally {
			mark(`code/didOpenDatabase/${name}`);
		}
	}
```

### 3. 数据库删除与重建

```81:91:openvscode-server/src/vs/base/browser/indexedDB.ts
	private static deleteDatabase(database: IDBDatabase): Promise<void> {
		return new Promise((c, e) => {
			// Close any opened connections
			database.close();

			// Delete the db
			const deleteRequest = indexedDB.deleteDatabase(database.name);
			deleteRequest.onerror = (err) => e(deleteRequest.error);
			deleteRequest.onsuccess = () => c();
		});
	}
```

**删除流程：**
1. **关闭连接**：关闭所有打开的数据库连接
2. **删除数据库**：调用 `indexedDB.deleteDatabase()`
3. **等待完成**：等待删除操作完成
4. **重建数据库**：重新调用 `doOpenDatabase()` 创建新数据库

---

## 四、数据迁移策略

### 1. 当前策略：破坏性升级

**核心特点：**
- ❌ **不保留数据**：升级时删除整个数据库
- ✅ **从服务器重新获取**：数据可以从远端服务器重新加载
- ✅ **简单可靠**：避免复杂的数据迁移逻辑

**适用场景：**
- 文件缓存数据（可以从服务器重新获取）
- 用户配置数据（可以从服务器同步）
- 临时数据（可以重新生成）

### 2. 为什么采用破坏性升级？

1. **数据可恢复性**：
   - 文件内容可以从服务器重新读取
   - 用户配置可以通过同步机制恢复
   - 日志数据可以重新生成

2. **简化实现**：
   - 避免复杂的数据迁移逻辑
   - 减少版本兼容性问题
   - 降低维护成本

3. **用户体验**：
   - 升级过程快速（删除重建）
   - 数据自动从服务器恢复
   - 用户无感知

### 3. 数据恢复机制

升级后，数据通过以下方式恢复：

**文件内容：**
```typescript
// 文件打开时自动从服务器读取
await fileService.readFile(resource);
// 读取后自动缓存到 IndexedDB
```

**用户配置：**
```typescript
// 通过用户数据同步服务恢复
await userDataSyncService.pull();
```

**工作区状态：**
```typescript
// 从服务器同步工作区配置
await workspaceService.initialize();
```

---

## 五、版本管理流程图

```
┌─────────────────────┐
│ 创建/打开数据库       │
│ IndexedDB.create()  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 检查数据库版本        │
│ version 参数         │
└──────────┬──────────┘
           │
           ├─── 数据库不存在 ───┐
           │                    │
           ├─── 版本号增加 ────┤
           │                    │
           └─── 结构不匹配 ────┘
           │                    │
           ▼                    ▼
┌─────────────────────┐   ┌─────────────────────┐
│ 触发 onupgradeneeded │   │ 触发 onupgradeneeded │
│ 创建缺失的 stores    │   │ 创建缺失的 stores    │
└──────────┬──────────┘   └──────────┬──────────┘
           │                         │
           └──────────┬──────────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │ 验证数据库结构        │
           │ 检查所有 stores      │
           └──────────┬──────────┘
                      │
                      ├─── 验证通过 ───┐
                      │                 │
                      └─── 验证失败 ───┘
                      │                 │
                      ▼                 ▼
           ┌─────────────────┐   ┌─────────────────┐
           │ 返回数据库实例    │   │ 删除数据库       │
           │ 完成初始化       │   │ 重建数据库       │
           └─────────────────┘   └────────┬────────┘
                                          │
                                          ▼
                                ┌─────────────────┐
                                │ 重新打开数据库   │
                                │ 完成初始化       │
                                └─────────────────┘
```

---

## 六、版本升级场景分析

### 场景 1：首次创建数据库

**触发条件：** 数据库不存在

**执行流程：**
1. `indexedDB.open()` 创建新数据库
2. 触发 `onupgradeneeded` 事件
3. 创建所有必需的 object stores
4. 验证结构（所有 stores 存在）
5. 返回数据库实例

**数据状态：** 空数据库，等待数据写入

### 场景 2：版本号升级

**触发条件：** 代码中版本号从 3 升级到 4

**执行流程：**
1. `indexedDB.open('vscode-web-db', 4)` 检测到版本变化
2. 触发 `onupgradeneeded` 事件
3. 创建新增的 object stores（如果有）
4. 验证结构
5. 返回升级后的数据库

**数据状态：** 保留现有数据，新增 stores 为空

**注意：** 当前实现中，如果结构不匹配，会删除重建，导致数据丢失。

### 场景 3：结构不匹配

**触发条件：** 数据库存在但缺少必需的 stores

**执行流程：**
1. `indexedDB.open()` 打开现有数据库
2. 验证结构时发现缺少 stores
3. 抛出 `MissingStoresError`
4. 捕获错误，删除数据库
5. 重新创建数据库
6. 返回新数据库实例

**数据状态：** 数据丢失，需要从服务器重新获取

---

## 七、版本管理最佳实践

### 1. 版本号管理

**建议：**
- ✅ **显式指定版本号**：对于重要的数据库（如文件系统数据库）
- ✅ **版本号递增**：每次结构变化时递增版本号
- ✅ **文档化变更**：记录每个版本的变更内容

**示例：**
```typescript
// 版本 1：初始版本
IndexedDB.create('vscode-web-db', 1, ['userdata-store']);

// 版本 2：添加日志存储
IndexedDB.create('vscode-web-db', 2, ['userdata-store', 'logs-store']);

// 版本 3：添加文件句柄存储
IndexedDB.create('vscode-web-db', 3, [
    'vscode-userdata-store',
    'vscode-logs-store',
    'vscode-filehandles-store'
]);
```

### 2. 结构变更策略

**添加新的 Object Store：**
```typescript
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    const transaction = event.target.transaction;
    
    // 创建新的 store（如果不存在）
    if (!db.objectStoreNames.contains('new-store')) {
        db.createObjectStore('new-store');
    }
};
```

**删除 Object Store：**
```typescript
// 注意：IndexedDB 不支持直接删除 store
// 需要删除整个数据库并重建
// 或者使用数据迁移策略
```

**修改 Object Store 结构：**
```typescript
// IndexedDB 不支持修改现有 store 的结构
// 需要创建新 store，迁移数据，删除旧 store
```

### 3. 数据迁移策略（未来改进）

如果需要保留数据，可以实现数据迁移逻辑：

```typescript
request.onupgradeneeded = async (event) => {
    const db = event.target.result;
    const transaction = event.target.transaction;
    const oldVersion = event.oldVersion;
    const newVersion = event.newVersion;
    
    // 版本 1 -> 2：添加日志存储
    if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('logs-store')) {
            db.createObjectStore('logs-store');
        }
    }
    
    // 版本 2 -> 3：重命名 stores 并迁移数据
    if (oldVersion < 3) {
        const oldStore = transaction.objectStore('userdata-store');
        const newStore = db.createObjectStore('vscode-userdata-store');
        
        // 迁移数据
        const request = oldStore.openCursor();
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                newStore.put(cursor.value, cursor.key);
                cursor.continue();
            }
        };
    }
};
```

---

## 八、关键代码位置

### 1. IndexedDB 核心实现

**文件位置：** `src/vs/base/browser/indexedDB.ts`

**关键方法：**
- `IndexedDB.create()`：创建数据库
- `IndexedDB.openDatabase()`：打开数据库（带错误处理）
- `IndexedDB.doOpenDatabase()`：实际打开逻辑
- `IndexedDB.deleteDatabase()`：删除数据库

### 2. 数据库初始化

**文件位置：** `src/vs/workbench/browser/web.main.ts`

```typescript
// 文件系统数据库初始化
indexedDB = await IndexedDB.create('vscode-web-db', 3, [
    'vscode-userdata-store',
    'vscode-logs-store',
    'vscode-filehandles-store'
]);
```

### 3. 存储服务数据库

**文件位置：** `src/vs/workbench/services/storage/browser/storageService.ts`

```typescript
// 存储服务数据库初始化（使用 undefined 版本）
return await IndexedDB.create(this.name, undefined, [
    IndexedDBStorageDatabase.STORAGE_OBJECT_STORE
]);
```

---

## 九、版本管理总结

### 核心机制

1. **版本号指定**：创建数据库时显式指定版本号
2. **自动升级**：版本号增加时自动触发升级
3. **结构验证**：打开后验证所有必需的 stores
4. **错误恢复**：结构不匹配时删除重建
5. **破坏性升级**：当前采用删除重建策略

### 优势

- ✅ **简单可靠**：避免复杂的数据迁移逻辑
- ✅ **快速升级**：删除重建速度快
- ✅ **数据可恢复**：数据可以从服务器重新获取
- ✅ **结构一致**：确保数据库结构与代码一致

### 局限性

- ⚠️ **数据丢失**：升级时数据会丢失（但可恢复）
- ⚠️ **无增量迁移**：不支持渐进式数据迁移
- ⚠️ **结构限制**：不支持修改现有 store 结构

### 适用场景

- ✅ **文件缓存**：可以从服务器重新获取
- ✅ **用户配置**：可以通过同步机制恢复
- ✅ **临时数据**：可以重新生成
- ❌ **关键业务数据**：需要保留的数据不适合此策略

---

## 十、参考资料

- [IndexedDB API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Using IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [IDBOpenDBRequest.onupgradeneeded - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/onupgradeneeded_event)

---

**文档创建时间：** 2024年
**最后更新：** 2024年

