# 部署文档

从零部署「单词天天斗」：准备小程序与云环境 → 建集合与权限 → 导入初始数据 → 部署云函数 → 构建 npm → 编译发布。

## 1. 环境准备

| 项目 | 要求 |
| --- | --- |
| 微信开发者工具 | 稳定版，已登录 |
| 小程序 AppID | 必须使用真实 AppID（测试号无法使用云开发） |
| 云开发 | 已在开发者工具开通，并创建环境 |
| Node.js | 建议 16 及以上（用于安装依赖） |

### 1.1 替换 AppID

打开 `project.config.json`，把 `appid` 字段改为你自己的小程序 AppID：

```json
{
  "appid": "你的小程序AppID"
}
```

> 未使用真实 AppID 时，开发者工具不会显示「云开发」按钮。

### 1.2 创建云开发环境

开发者工具顶部点击「云开发」→ 开通 → 新建环境，记下环境 ID（形如 `cloud1-xxxxxxxx`）。

### 1.3 配置环境 ID

编辑 `miniprogram/utils/config.ts`：

```ts
cloudEnv: {
  develop: '你的开发环境ID',
  release: '你的生产环境ID'
}
```

- 开发阶段只填 `develop` 即可
- `release` 用于正式版；若暂无独立生产环境，可先填同一个环境 ID，但上线前务必替换占位符
- 两个字段都不能保留 `__RELEASE_ENV__` 这类占位内容，否则正式版初始化失败

## 2. 创建云数据库集合

在「云开发控制台 → 数据库」中新建 6 个集合：

```
user  userWord  combat  book  word  kv
```

### 2.1 权限配置

| 集合 | 权限 | 说明 |
| --- | --- | --- |
| `user` | 仅创建者可读写 | 用户资料、设置、统计 |
| `userWord` | 仅创建者可读写 | 生词本 |
| `combat` | 自定义安全规则 | 对战双方需读写同一条房间记录 |
| `book` | 所有用户可读 | 单词书列表 |
| `word` | 所有用户可读 | 单词数据 |
| `kv` | 所有用户可读，仅创建者可读写 | 全局配置与 NPC |

`combat` 必须使用**自定义安全规则**，而不是简易权限：

```json
{
  "read": true,
  "write": true
}
```

原因：随机匹配与好友对战需要双方同时写入同一条房间记录，且代码中使用了 `'{openid}'` 占位符。该占位符**仅在自定义安全规则模式下会被替换**；若使用「仅创建者可读写」等简易权限，占位符会按普通字符串匹配，条件命中 0 条，`update` 不报错但返回 `updated: 0`，表现为「匹配一直失败」。

## 3. 导入初始数据

项目根目录提供三个数据文件，格式为 **JSON Lines**（每行一条完整 JSON 记录）。

| 文件 | 目标集合 | 必需性 |
| --- | --- | --- |
| `book.json` | `book` | 必需，且必须含 `_id` 为 `random` 的记录 |
| `word.json` | `word` | 必需 |
| `kv.json` | `kv` | 必需，含 `config` 与 `npc` 两条 |

导入步骤：云开发控制台 → 数据库 → 选择集合 → 「导入」→ 选择对应文件 → 冲突处理选择 **Upsert** → 导入。

### 3.1 字段说明

**book**

```json
{"_id":"random","name":"随机词库","shortName":"随机","image":"","wordsNumber":10,"peopleNumber":1,"sort":1}
```

| 字段 | 说明 |
| --- | --- |
| `_id` | 单词书 ID，`random` 为新用户默认词库，缺失会导致新用户注册失败 |
| `name` / `shortName` | 全称 / 缩写，缩写显示在首页工具栏 |
| `wordsNumber` | 词数 |
| `peopleNumber` | 选择人数 |
| `sort` | 排序值，越小越靠前 |

**word**

```json
{"_id":"w001","word":"abandon","usphone":"əˈbændən","trans":[{"tranCn":"放弃；抛弃","pos":"vt"}],"bookId":"random","rank":1}
```

| 字段 | 说明 |
| --- | --- |
| `_id` | 单词 ID，需全局唯一 |
| `word` / `usphone` | 单词 / 美式音标 |
| `trans` | 释义数组，含 `tranCn`（中文）与 `pos`（词性） |
| `bookId` | 所属单词书，需与 `book._id` 对应 |
| `rank` | 词内排序 |

**kv**

```json
{"key":"config","value":{"backgroundMusicUrl":"","wechat":"","about":"关于项目说明"}}
{"key":"npc","value":[{"_openid":"npc_001","nickname":"单词小能手","avatar":""}]}
```

| 记录 | 说明 |
| --- | --- |
| `key: "config"` | `backgroundMusicUrl` 对战背景音乐地址；`about` 关于页文案 |
| `key: "npc"` | 人机对战使用的虚拟对手头像与昵称数组 |

> 两条记录缺一不可，否则人机对战、关于页初始化会异常。

## 4. 部署云函数

1. 右键 `cloudfunctions/server` 目录
2. 选择「上传并部署：云端安装依赖（不上传 node_modules）」
3. 等待上传与依赖安装完成，控制台出现成功提示

注意事项：

- 云函数根目录需在 `project.config.json` 中正确指向 `cloudfunctions/`（项目已配置）
- 云函数运行环境应支持 `wx-server-sdk`
- 修改云函数代码后必须重新上传，否则调用到的仍是旧版本

## 5. 安装依赖与构建 npm

小程序运行时依赖位于 `miniprogram/node_modules`，需要通过「构建 npm」生成 `miniprogram_npm`。

```bash
cd miniprogram
npm install
```

然后在开发者工具菜单「工具 → 构建 npm」。

说明：

- `miniprogram_npm` 是构建产物，由工具把依赖拍平、转译生成，**不是** `node_modules` 的副本
- 新增或删除依赖后必须重新执行「构建 npm」
- 根目录的 `node_modules` 仅用于开发工具链（TypeScript、ESLint、类型定义），不参与小程序运行

## 6. 编译与本地验证

1. 点击「编译」，检查控制台无报错
2. 首次进入应自动注册用户（写入 `user` 集合）
3. 依次验证：首页加载 → 切换单词书 → 随机匹配 → 每日词汇 → 生词本 → 排行榜 → 设置

自测清单：

- [ ] 首页能显示单词书与提示卡数量
- [ ] 随机匹配能创建/加入房间并进入对战
- [ ] 好友对战可通过分享加入
- [ ] 超时未匹配可转入人机对战
- [ ] 答错单词进入生词本
- [ ] 排行榜能展示前 20 名与自己的排名
- [ ] 设置项修改后重启小程序仍然生效

## 7. 发布正式版

1. 将 `miniprogram/utils/config.ts` 的 `release` 改为生产环境 ID
2. 在开发者工具「上传」生成体验版
3. 在微信公众平台「管理 → 版本管理」提交审核
4. 审核通过后发布

### 7.1 体验成员配置

开发版与体验版只有开发者、体验成员可以打开。他人扫码提示「暂无体验权限」时：

公众平台 → 成员管理 → 体验成员 → 添加对方微信号。

## 8. 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 调用云函数报 `-501000 FunctionName parameter could not be found` | 云函数未部署或函数名不匹配，重新上传 `cloudfunctions/server` |
| 云开发按钮不显示 | 使用了测试号或无效 AppID，需真实 AppID |
| 新用户注册失败 | `book` 集合缺少 `_id` 为 `random` 的记录 |
| 随机匹配一直匹配不上 / `updated: 0` | `combat` 集合用了简易权限，改为自定义安全规则 `{"read": true, "write": true}` |
| 组件「未找到」 | 组件缺少 `.wxml` 或 `.json` 文件；即使纯逻辑组件也需补齐四件套 |
| 人机对战昵称为空 | `kv` 集合缺少 `key` 为 `npc` 的记录 |
| 关于页内容为空 | `kv` 集合缺少 `key` 为 `config` 的记录 |
| 构建 npm 后仍提示找不到包 | 未执行「构建 npm」，或执行前未在 `miniprogram` 目录 `npm install` |
| 正式版云环境初始化失败 | `config.ts` 的 `release` 仍为占位符或填错 |

## 9. 主题与样式说明

全局配色通过 `miniprogram/app.wxss` 中的 CSS 变量统一管理，页面与组件通过 `var(--brand)` 等变量引用：

| 变量 | 用途 |
| --- | --- |
| `--brand` / `--brand-deep` / `--brand-light` | 主色及深浅变化 |
| `--brand-soft` / `--brand-wash` | 浅色底、卡片衬底 |
| `--accent` | 强调色 |
| `--text-primary` / `--text-secondary` / `--text-muted` | 文字层级 |
| `--bg-page` | 页面背景 |
| `--line` | 分割线 |
| `--shadow-brand` | 品牌色阴影 |

更换主题只需修改这一组变量，无需逐页改动。
