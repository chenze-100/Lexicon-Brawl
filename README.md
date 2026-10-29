# 单词天天斗

一款基于**微信小程序原生框架 + 微信云开发**的单词学习与对战应用。以「单词选释义」为核心玩法，提供好友对战、随机匹配、人机对战三种对战模式，并配套每日词汇、生词本、排行榜、设置等完整业务链路。

- 前后端一体：前端为小程序原生 TypeScript，后端为云函数 + 云数据库，无需自建服务器
- 主题风格：活力橙红对战风，通过全局 CSS 变量统一管理配色
- 词库可扩展：内置词库 + 自定义单词书，支持无限新增

## 功能模块

### 首页

- 用户信息：未登录展示默认头像与「点击登录」，登录后展示头像、昵称、词力值、对战局数与胜场
- 工具栏：提示卡数量、当前单词书；点击可查看提示卡说明或切换单词书（上滑分页加载）
- 功能入口：随机匹配、好友对战、每日词汇、生词本
- 底部栏：排行榜、关于、意见反馈（使用微信原生 `feedback` 能力）
- 新用户引导：首次进入提示「添加到我的小程序」，确认后不再弹出

### 对战模式

三种入口共用同一套答题与结算逻辑：

- **好友对战**：房主创建房间并分享到聊天/群，对方点击「加入房间」；房主点击「开始对战」后双方进入对局
- **随机匹配**：按单词书匹配在线房间；无可用房间则创建并等待，超过 2 分钟自动转入人机对战
- **人机对战**：从 `kv` 集合的 `npc` 数据中随机取头像昵称，正确率 75%，答题耗时 2~3 秒随机

对战规则：

| 规则 | 说明 |
| --- | --- |
| 词汇数量 | 8 / 10 / 12 / 15 / 20 / 30，由房主在设置页选择 |
| 答题时间 | 每题 10 秒，超时按答错处理 |
| 得分 | 答对按速度给分，最高 100 分最低 1 分；答错扣 10 分 |
| 提示卡 | 使用提示卡答题同样计分，该单词自动进入生词本 |
| 掉线判定 | 任一方退出立即结算；倒计时结束 5 秒后仍未切换题目也判定为「对方逃离」 |
| 结算 | 展示逐题结果与得分、输赢、词力值变化，可分享战绩、再来一局 |

### 每日词汇

- 按当前单词书出题，每题 30 秒倒计时，答对 +1 分
- 每局 3 条生命值，答错扣 1 条；用完后可分享获取一次复活
- 结算时与历史最高分比较，刷新则写入排行榜记录

### 生词本

- 自动收集对战与每日词汇中答错、以及使用提示卡答题的单词
- 按加入时间倒序展示，默认隐藏释义，点击单词可展开
- 长按支持删除、播放发音；支持一键清空

### 排行榜

- 支持「词力值」与「每日词汇最高分」两种榜单，各展示前 20 名
- 底部展示当前用户自己的排名

### 设置

- 对战词汇数量
- 背景音乐、单词发音、错题震动的默认开关
- 清空生词本
- 修改头像与昵称

## 技术栈

- 前端：[微信小程序原生框架](https://developers.weixin.qq.com/miniprogram/dev/framework/)，TypeScript + WXML + WXSS
- 后端：[微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)（云函数 + 云数据库）
- 全局状态：[wxMiniStore](https://github.com/xiaoyao96/wxMiniStore)
- 路由：[wxapp-router](https://github.com/JerryC8080/wxapp-router)
- 事件总线：[mitt](https://github.com/developit/mitt)
- 云函数分层：`index.js` 入口 + `controller`（业务编排）+ `model`（数据访问），路由以内置路由表实现
- 样式：CSS 变量统一主题 + 原生 CSS 动画

## 目录结构

```
wechat-app-words-pk/
├── miniprogram/                 # 小程序前端
│   ├── app.ts / app.json / app.wxss
│   ├── pages/
│   │   ├── home/                # 首页（组件化拆分）
│   │   ├── combat/              # 对战页（friend / random / pk / npc / settle 场景组件）
│   │   ├── learning/            # 每日词汇
│   │   ├── review/              # 生词本
│   │   ├── ranking/             # 排行榜
│   │   ├── setting/             # 设置
│   │   └── about/               # 关于
│   ├── components/              # 全局组件（header / loading / toast / router）
│   ├── models/                  # 数据模型层（user / book / word / combat / userWord / kv）
│   ├── utils/                   # 配置、工具函数、全局状态
│   ├── images/ audios/          # 静态资源
│   └── miniprogram_npm/         # 「构建 npm」产物
├── cloudfunctions/
│   └── server/                  # 云函数
│       ├── index.js             # 入口与路由分发
│       ├── controller/          # 业务控制器
│       └── model/               # 数据库访问
├── book.json / word.json / kv.json   # 初始数据（JSON Lines）
├── project.config.json          # 开发者工具项目配置
└── DEPLOY.md                    # 部署文档
```

## 快速开始

1. 微信开发者工具导入项目根目录，把 `project.config.json` 中的 `appid` 替换为你的小程序 AppID
2. 在 `miniprogram/utils/config.ts` 中填写云开发环境 ID
3. 创建云数据库集合并导入初始数据，权限按部署文档配置
4. 右键 `cloudfunctions/server` →「上传并部署：云端安装依赖」
5. `miniprogram` 目录执行 `npm install`，开发者工具「工具 → 构建 npm」
6. 编译预览，即可体验

完整步骤、权限配置与常见问题见 [DEPLOY.md](DEPLOY.md)。

## 数据库集合

| 集合 | 用途 | 建议权限 |
| --- | --- | --- |
| `user` | 用户信息、词力值、设置、统计数据 | 仅创建者可读写 |
| `userWord` | 用户生词本 | 仅创建者可读写 |
| `combat` | 对战房间与对局状态 | 自定义安全规则：所有用户可读写 |
| `book` | 单词书列表 | 所有用户可读 |
| `word` | 单词数据 | 所有用户可读 |
| `kv` | 全局配置与 NPC 数据 | 所有用户可读 |

`book` 必须包含 `_id` 为 `random` 的记录（新用户默认单词书）；`kv` 必须包含 `key` 为 `config` 和 `npc` 的两条记录。字段明细见部署文档。

## 文档

- [DEPLOY.md](DEPLOY.md)：环境准备、数据库与权限、云函数部署、发布与排错
- [LICENSE.md](LICENSE.md)：开源协议
