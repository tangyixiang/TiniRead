<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight mt-6 mb-2" id="heading-0">MarkView 本地 Markdown 编辑与阅读器</h1>
<p class="text-sm leading-7 text-[var(--text-muted)] mb-3">基于 Rust 构建的现代化本地 Markdown 知识阅读与所见即所得编辑器。


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight mt-5 mb-2" id="heading-1">1. 核心设计理念</h2>
<p class="text-sm leading-7 text-[var(--text-muted)] mb-3">以数字排版工艺为导向，打造极简、克制且耐看的本地 Markdown 阅读与编辑工具。消解工具界面的压迫感，呈现纯粹的内容本位体验。


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="p-4 rounded-2xl bg-[var(--callout-bg)] border border-[var(--callout-border)] flex items-start gap-3 text-xs leading-relaxed text-[var(--text-muted)] my-3">
<div class="w-5 h-5 rounded-lg bg-[var(--text-main)] text-[var(--bg-card)] flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">!</div>
<div>设计信条：界面的克制，是对阅读者最深的敬意。所有格式调整无需记忆复杂 Markdown 语法符号，交互直达。</div>
</div>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight mt-5 mb-2" id="heading-2">2. 交互功能指南</h2>
<ul class="list-disc pl-5 my-2 space-y-1 text-xs text-[var(--text-muted)]">
<li><strong class="font-semibold text-[var(--text-main)]">原地即时编辑</strong>：在正文中任意位置点击即可直接输入，修改实时增量保存。</li>
<li><strong class="font-semibold text-[var(--text-main)]">选中文本浮动气泡</strong>：鼠标划词选中文本，上方立即弹出浮动格式工具条（加粗、斜体、删除线、黄色/绿色荧光高亮、行内代码、标题转换）。</li>
<li><strong class="font-semibold text-[var(--text-main)]">右键傻瓜式添加块</strong>：在编辑区任意位置点击鼠标右键，唤起结构化块级菜单，支持一键插入一级/二级/三级标题、待办清单、提示引语盒、代码块与分割线。</li>
<li><strong class="font-semibold text-[var(--text-main)]">多栏布局切换</strong>：支持三栏（工作台）、双栏（文档列表+正文）与单栏（专注全屏）即时切换。</li>
<li><strong class="font-semibold text-[var(--text-main)]">拖拽即开</strong>：支持直接拖拽本地 .md 文件或文件夹到窗口释放打开。</li>
</ul>
<h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight mt-5 mb-2" id="heading-3">3. 功能清单</h2>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[var(--bg-window)] cursor-pointer transition">
<input type="checkbox" checked="" class="w-4 h-4 rounded-md border-[var(--border-strong)] text-[var(--text-main)] focus:ring-0">
<span class="line-through text-[var(--text-light)] text-xs">现代化纸质排版与 3 套精选主题（浅灰冷白、温润羊皮、深邃极夜）</span>
</div>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[var(--bg-window)] cursor-pointer transition">
<input type="checkbox" checked="" class="w-4 h-4 rounded-md border-[var(--border-strong)] text-[var(--text-main)] focus:ring-0">
<span class="line-through text-[var(--text-light)] text-xs">划词选中文本浮动格式气泡</span>
</div>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[var(--bg-window)] cursor-pointer transition">
<input type="checkbox" checked="" class="w-4 h-4 rounded-md border-[var(--border-strong)] text-[var(--text-main)] focus:ring-0">
<span class="line-through text-[var(--text-light)] text-xs">右键傻瓜式插入 H1/H2/H3 标题与块组件</span>
</div>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[var(--bg-window)] cursor-pointer transition">
<input type="checkbox" checked="" class="w-4 h-4 rounded-md border-[var(--border-strong)] text-[var(--text-main)] focus:ring-0">
<span class="line-through text-[var(--text-light)] text-xs">原生 Rust 后端本地文件安全读写与扫描</span>
</div>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[var(--bg-window)] cursor-pointer transition">
<input type="checkbox" class="w-4 h-4 rounded-md border-[var(--border-strong)] text-[var(--text-main)] focus:ring-0">
<span class="text-[var(--text-muted)] text-xs">文档双向链接（WikiLink）快速关联</span>
</div>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="overflow-x-auto my-3 border border-[var(--border-subtle)] rounded-xl"><table class="w-full text-left text-xs"><thead class="bg-[var(--bg-window)] border-b border-[var(--border-subtle)] text-[var(--text-muted)]"><tr><th class="py-2.5 px-3 font-semibold">维度</th><th class="py-2.5 px-3 font-semibold">MarkView</th><th class="py-2.5 px-3 font-semibold">传统编辑器</th></tr></thead><tbody class="divide-y divide-[var(--border-subtle)]"><tr class="hover:bg-[var(--bg-window)]/50"><td class="py-2.5 px-3 text-[var(--text-main)]"><strong class="font-semibold text-[var(--text-main)]">渲染体验</strong></td><td class="py-2.5 px-3 text-[var(--text-main)]">所见即所得流式排版</td><td class="py-2.5 px-3 text-[var(--text-main)]">双栏切分预览或纯文本</td></tr><tr class="hover:bg-[var(--bg-window)]/50"><td class="py-2.5 px-3 text-[var(--text-main)]"><strong class="font-semibold text-[var(--text-main)]">内存开销</strong></td><td class="py-2.5 px-3 text-[var(--text-main)]">极低（约 2.5 MB）</td><td class="py-2.5 px-3 text-[var(--text-main)]">臃肿（数百 MB）</td></tr><tr class="hover:bg-[var(--bg-window)]/50"><td class="py-2.5 px-3 text-[var(--text-main)]"><strong class="font-semibold text-[var(--text-main)]">操作方式</strong></td><td class="py-2.5 px-3 text-[var(--text-main)]">划词气泡 + 右键傻瓜插入</td><td class="py-2.5 px-3 text-[var(--text-main)]">强制记忆符号标记</td></tr></tbody></table></div>
<h2 class="text-xl font-bold text-[var(--text-main)] tracking-tight mt-5 mb-2" id="heading-4">4. 架构代码片段</h2>


<p class="text-sm leading-7 text-[var(--text-muted)] mb-3"><div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-window)] overflow-hidden my-3">
<div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
<span class="font-mono font-medium text-[var(--text-main)]">rust</span>
<button class="copy-btn hover:text-[var(--text-main)] transition font-medium" data-code="pub struct Document {
pub title: String,
pub path: std::path::PathBuf,
pub word_count: usize,
}">复制</button>
</div>
<pre class="p-4 text-xs font-mono overflow-x-auto leading-6 text-[var(--text-main)]"><code>pub struct Document {
pub title: String,
pub path: std::path::PathBuf,
pub word_count: usize,
}</code></pre>
</div>

