# TiniRead

一个轻量、纯本地的 Markdown 所见即所得阅读与编辑器。没有复杂的配置，直接在排版好的文档上阅读与修改。

---

## 主要特性

- **所见即所得**：不需要左右分栏对照，直接在渲染好的页面上打字编辑，支持完整的撤销与重做。
- **划词与快捷菜单**：选中文字自动弹出工具条（加粗、斜体、删除线、代码、多色高亮），右键可快速插入标题、任务清单、提示引语盒和代码块。
- **工作区与卡片列表**：支持打开本地文件夹，提供目录树导航与卡片列表预览，文件在外部被修改时自动热重载。
- **大纲与阅读进度**：自动提取标题生成大纲树，点击快速跳转，自动记录每篇文档的阅读滚动位置。
- **多套阅读排版**：内置明亮、羊皮纸、深色三款主题，支持字号与行距调节。
- **纯本地、零依赖上传**：所有文件操作与历史记录均保存在本地 SQLite，不联网，不收集任何数据。
- **双模式运行**：既可作为 Tauri 原生桌面客户端运行，也可使用内置 Rust 服务端在本地浏览器中运行。

---

## 技术架构

```text
+-------------------------------------------------------------+
|                          TiniRead                           |
|                                                             |
| 前端交互层 (React 19 + TypeScript + Tailwind CSS v4 + Vite) |
| - 工作区目录树 (Sidebar)                                    |
| - 文件卡片流检索 (CardList)                                 |
| - 原地排版编辑器 (Editor + ContextMenu + SelectionToolbar)   |
| - 动态大纲与进度追踪 (Outline + Header)                     |
|                                                             |
| 桌面通信层 (Tauri 2 IPC Command & Event)                    |
|                                                             |
| 核心后端层 (Rust 2021)                                      |
| - 本地文件系统操作与工作区扫描 (fs_ops)                     |
| - 原生文件热变动监听器 (watcher / notify)                   |
| - 本地持久化存储引擎 (db / rusqlite)                        |
| - 原生文件与目录对话框桥接 (rfd)                             |
| - 独立轻量 HTTP 服务模块 (src-server / tiny_http)           |
+-------------------------------------------------------------+
```

---

## 下载与安装

### 预编译安装包

前往项目的 [Releases 页面](https://github.com) 下载对应操作系统的安装包：

- **macOS**：`.dmg`（支持 Apple Silicon M 系列与 Intel 架构）
- **Windows**：`.exe`（基于 NSIS 架构打包）
- **Linux**：`.deb`（支持 Debian / Ubuntu 系发行版）

### macOS 用户安装注意

因开源个人构建未加入商业付费开发者证书签名，若在 macOS（尤其是 M1 / M2 / M3 芯片）打开应用时提示 **“文件已损坏，您应该将它移到废纸篓”**，此为系统 Gatekeeper 安全拦截机制所致。

请在终端中执行以下命令清除下载隔离属性即可正常使用：

```bash
xattr -cr /Applications/TiniRead.app
```

---

## 开发与编译

### 前置环境

- [Node.js](https://nodejs.org/)（版本 >= 18.0，推荐 v20+）
- [Rust 工具链](https://rustup.rs/)（版本 >= 1.77.2，推荐 stable 分支）
- [Cargo](https://doc.rust-lang.org/cargo/) 包管理器
- 系统依赖（Linux 环境需安装 `libwebkit2gtk-4.1-dev` 等原生库）

### 1. 安装项目依赖

```bash
npm install
```

### 2. 桌面端本地开发调试

启动桌面端开发模式（自动启动 Vite 服务并唤起 Tauri 原生桌面窗口）：

```bash
npm run tauri:dev
```

### 3. 构建发布安装包

构建当前平台专属的最终发布包（产物位于 `src-tauri/target/release/bundle/`）：

```bash
npm run tauri:build
```

如需在 macOS 上打包通用双架构（Universal Binary）安装包：

```bash
npm run tauri:build -- --target universal-apple-darwin
```

### 4. 独立 Web 服务端开发模式

TiniRead 包含独立的轻量级 Rust Web 服务模块，可作为单机本地浏览器端使用：

```bash
# 启动本地 HTTP 服务（默认监听 http://localhost:8080）
cargo run
```

---

## 快捷键与操作说明

| 快捷键 / 操作 | 功能描述 |
| :--- | :--- |
| `Ctrl + S` / `Cmd + S` | 保存当前文档 |
| `Ctrl + Z` / `Cmd + Z` | 撤销上一步编辑 |
| `Ctrl + Y` / `Cmd + Shift + Z` | 重做已撤销编辑 |
| `划选正文文本` | 自动唤起浮动格式与色彩标注工具条 |
| `编辑区鼠标右键` | 呼出结构化块（标题/待办/引语盒/代码块）插入菜单 |
| `文件或目录拖拽` | 将本地 `.md` 文件或文件夹直接拖拽入窗口快速打开 |

---

## 目录结构

```text
markdown-view/
├── .github/
│   └── workflows/
│       └── release.yml     # 多平台自动化编译打包 GitHub Action 工作流
├── src/                    # 前端工程源码 (React 19 + TypeScript + Tailwind CSS v4)
│   ├── api/                # Tauri IPC 接口通信封装
│   ├── components/         # 界面核心组件 (编辑器、侧边栏、卡片流、大纲等)
│   ├── styles/             # 排版主题与全局样式配置
│   ├── types.ts            # 全局 TypeScript 类型定义
│   └── utils/              # Markdown 解析与格式转换工具
├── src-tauri/              # Tauri 2 原生桌面端核心
│   ├── src/                # Rust 后端源码 (文件操作、SQLite 存储、文件监听)
│   ├── capabilities/       # Tauri 2 窗口与安全权限策略配置
│   ├── tauri.conf.json     # 桌面应用窗口与打包配置文件
│   └── Cargo.toml          # Tauri 核心 Rust 依赖清单
├── src-server/             # 独立轻量 Rust Web 服务端源码
├── dist/                   # 前端静态资源构建输出目录
├── index.html              # HTML 宿主入口
├── vite.config.ts          # Vite 打包配置
├── Cargo.toml              # 根目录 Rust 工程配置
└── package.json            # 前端依赖与构建脚本配置
```

---

## 开源协议

本项目基于 MIT 协议 开源。