# TiniRead

TiniRead 是一个基于 Rust 与现代化前端技术构建的本地 Markdown 所见即所得阅读与编辑工具，专为纯粹、沉浸、高效的本地文档阅读与轻量编辑体验而设计。

## 核心特性

- **所见即所得原地编辑**：文档排版即是编辑界面，直接在正文中点击输入，实时渲染，支持撤销与重做。
- **划词浮动格式工具条**：划选任意文本自动弹出气泡菜单，支持加粗、斜体、删除线、荧光高亮、行内代码与标题转换。
- **右键结构化块菜单**：编辑区右键快速插入 H1/H2/H3 标题、待办任务清单、提示引语盒（Callout）、代码块与分割线。
- **多栏工作区布局**：支持三栏（目录树 + 卡片列表 + 正文）、双栏及单栏专注阅读模式一键切换。
- **文档大纲与进度追踪**：自动解析文档标题生成大纲目录，滚动实时追踪阅读进度与字数统计。
- **精选阅读排版主题**：内置现代冷白、温润羊皮、深邃极夜三套主题，字号与行距可快捷调节。
- **本地文件安全管理**：原生 Rust 处理本地文件读写与工作区扫描，支持拖拽文件即开与自动增量保存。
- **双模运行架构**：既可作为 Tauri 2.0 桌面原生应用运行，也可作为极轻量 Rust Web 服务运行（内存占用约 2.5 MB）。

## 架构与技术栈

- **后端**：Rust (tiny_http, pulldown-cmark, serde, serde_json, open)
- **桌面端**：Tauri 2.0
- **前端**：React 19, TypeScript, Tailwind CSS v4, 本地打包 WOFF2 字体
- **构建工具**：Vite, Cargo

## 目录结构

```text
markdown-view/
├── src/                # 前端工程源码 (React 19 + TypeScript + Tailwind v4)
├── src-tauri/          # Tauri 2.0 桌面端工程 (IPC 绑定、窗口配置、原生打包)
├── src-server/         # 独立轻量 Rust Web 服务端源码
├── dist/               # 前端本地静态构建产物
├── index.html          # 前端 HTML 容器
├── vite.config.ts      # Vite 构建配置
├── Cargo.toml          # Rust 服务端配置
└── package.json        # 前端依赖与脚本配置
```

## 快速上手

### 环境准备

- [Rust](https://www.rust-lang.org/) (建议最新稳定版)
- [Node.js](https://nodejs.org/) (18+ 版本)

### 1. 以桌面客户端运行 (Tauri)

安装依赖并启动桌面应用：

```bash
npm install
npm run tauri dev
```

构建桌面发布包：

```bash
npm run tauri build
```

### 2. 以本地 Web 服务运行 (Rust)

直接通过 Cargo 启动内置 HTTP 服务：

```bash
cargo run
```

启动后在浏览器访问控制台提示的地址（默认为 `http://localhost:8080`）。

### 3. 前端独立开发模式

```bash
npm run dev
```

## 快捷键与常用操作

- `Ctrl + S`：手动保存当前文档
- `Ctrl + Z` / `Ctrl + Y`：撤销 / 重做
- 划选文本：唤起浮动格式工具条
- 编辑区右键：呼出结构化块插入菜单
- 拖拽 `.md` 文件至窗口：直接导入并打开文档