# ArikaShow 🌌

<div align="center">

![ArikaShow Logo](asset/img/film/interstellar.png)

**一个沉浸式的科幻主题展示平台 | An Immersive Sci-Fi Showcase Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![GSAP](https://img.shields.io/badge/GSAP-20C997?style=flat&logo=greensock&logoColor=white)](https://gsap.com/)

</div>

---

## 📖 项目概述 | Project Overview

ArikaShow 是一个基于现代 Web 技术构建的沉浸式科幻主题展示平台。该项目融合了 3D 渲染、粒子系统、物理引擎和流畅的动画效果，为用户提供极具视觉冲击力的交互体验。

### ✨ 核心特性

- **🎨 沉浸式 3D 体验** - 使用 Three.js 实时渲染 3D 模型与场景
- **✨ 动态粒子系统** - 星空背景与内容区域粒子跟随滚动效果
- **🎬 流畅动画** - 基于 GSAP 的高性能动画过渡
- **🎮 物理交互** - 集成 Matter.js 实现真实的物理效果
- **🎵 氛围音效** - 精选背景音乐增强沉浸感
- **📱 响应式设计** - 支持桌面端与移动端设备
- **🚀 多页面展示** - 包含主页、黑洞渲染、赛博展示柜等多个独立页面

### 🎯 项目用途

- **个人作品集展示** - 以独特的方式展示项目、技能和经历
- **技术演示平台** - 展示前端 3D 渲染、动画等前沿技术能力
- **创意网页设计参考** - 提供科幻风格 Web 设计的实现范例

---

## 📁 项目结构 | Project Structure

```
ArikaShow/
├── index.html              # 主页 - Deep Glow (3D星空展示)
├── load.html               # 加载页面 - 星际通讯终端
├── blackhole.html          # 黑洞渲染页面
├── slip.html               # 赛博展示柜页面
├── contact call.html       # 联系方式页面
├── Email.html              # 邮件联系页面
│
├── asset/                  # 资源文件夹
│   ├── BGM/                # 背景音乐
│   │   └── loading/        # 加载页面专用音乐
│   ├── img/                # 图片资源
│   │   ├── 001/            # Blender 相关图片
│   │   ├── 006/            # 项目展示图片
│   │   ├── 010/            # 工具截图
│   │   ├── film/           # 电影海报
│   │   └── game/           # 游戏截图
│   ├── *.glb               # 3D 模型文件
│
├── Js/                     # Lottie 动画 JSON 文件
│
├── .gitignore              # Git 忽略配置
└── README.md               # 项目文档
```

---

## 🛠️ 技术栈 | Tech Stack

| 技术 | 版本 | 用途 |
|------|------|------|
| **Three.js** | r128 | 3D 场景渲染、GLTF 模型加载 |
| **GSAP** | 3.12.2+ | 高性能动画库 |
| **Lottie Web** | 5.12.2 | 矢量动画播放 |
| **Matter.js** | 0.19.0 | 2D 物理引擎 |
| **Tailwind CSS** | CDN | 原子化 CSS 框架 |
| **LordIcon** | - | 图标动画库 |
| **Google Fonts** | - | 字体资源 (Orbitron, Inter, JetBrains Mono 等) |

---

## 📦 安装说明 | Installation

### 前置要求 | Prerequisites

- **浏览器支持**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **WebGL 支持**: 需要 WebGL 1.0+ 兼容的显卡
- **网络连接**: 首次加载需要从 CDN 获取依赖库

### 快速开始 | Quick Start

#### 方式一：直接打开（推荐）

由于项目使用 CDN 加载依赖，无需安装任何工具：

```bash
# 克隆仓库
git clone https://github.com/yourusername/ArikaShow.git

# 进入项目目录
cd ArikaShow

# 直接在浏览器中打开
# 双击 index.html 或使用 Live Server
```

#### 方式二：使用本地服务器（推荐用于开发）

```bash
# 使用 Python 内置服务器
python -m http.server 8080

# 或使用 Node.js 的 http-server
npx http-server -p 8080

# 或使用 VS Code 的 Live Server 扩展
# 右键 index.html -> Open with Live Server
```

#### 方式三：使用 Vite（开发模式）

```bash
# 安装 Vite（如未安装）
npm install -g vite

# 启动开发服务器
vite

# 访问 http://localhost:5173
```

> ⚠️ **注意**: 由于使用了 ES Module 和某些安全策略，建议始终通过 HTTP 服务器访问而非直接使用 `file://` 协议。

---

## 🚀 使用指南 | Usage Guide

### 页面导航

| 页面 | 文件 | 描述 |
|------|------|------|
| **主页面** | [index.html](index.html) | Deep Glow - 3D 星空主题首页，包含导航、英雄区、项目展示、技能展示、联系方式等模块 |
| **加载页** | [load.html](load.html) | 星际通讯终端风格的加载动画页面 |
| **黑洞渲染** | [blackhole.html](blackhole.html) | 实时黑洞引力透镜效应渲染演示 |
| **赛博展示柜** | [slip.html](slip.html) | CYBER SHOWCASE - 赛博朋克风格的卡片轮播展示 |

### 主要功能演示

#### 1. 主页面 (index.html)

主页面是一个完整的单页应用，包含以下功能模块：

```javascript
// 自动旋转的 3D 模型展示
// 支持鼠标拖拽交互（OrbitControls）
// 粒子星空背景随滚动变化
// GSAP 驱动的入场动画序列
// 平滑的章节切换过渡
```

**操作指南：**
- 🖱️ **鼠标拖拽**: 旋转 3D 模型视角
- 🔄 **滚轮缩放**: 调整模型距离
- ⬇️ **向下滚动**: 浏览各内容区块
- 🎵 **点击播放**: 触发背景音乐（需用户交互）

#### 2. 黑洞渲染 (blackhole.html)

基于 WebGL 的实时黑洞可视化：

```
特性：
- 引力透镜效应模拟
- 吸积盘光效渲染
- 实时参数调节面板
- 高性能 Shader 计算
```

#### 3. 赛博展示柜 (slip.html)

动态卡片轮播系统：

```
特性：
- Lottie 动画图标
- GSAP 驱动的滑动过渡
- 响应式卡片布局
- 霓虹灯发光效果
```

---

## ⚙️ 配置选项 | Configuration

### Tailwind CSS 自定义配置

在 `index.html` 中可以自定义以下主题变量：

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'deep-space': '#050508',      // 深空背景色
                'neon-blue': '#00d4ff',        // 霓虹蓝
                'neon-cyan': '#00fff2',        // 霓虹青
                'deep-blue': '#0a1628',        // 深蓝色
                'card-bg': 'rgba(10, 22, 40, 0.6)', // 卡片背景
            },
            fontFamily: {
                'sans': ['Inter', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            }
        }
    }
}
```

### CSS 自定义属性 (slip.html)

```css
:root {
    --cyan: #00f0ff;      /* 主色调 - 青色 */
    --magenta: #ff00ff;   /* 强调色 - 品红 */
    --yellow: #f0ff00;    /* 警告色 - 黄色 */
    --red: #ff0040;       /* 错误色 - 红色 */
    --bg-dark: #0a0a0f;   /* 深色背景 */
    --bg-card: #0d0d1a;   /* 卡片背景 */
    --border-glow: #00f0ff; /* 边框发光色 */
}
```

### 3D 模型配置

项目中的 3D 模型位于 `asset/` 目录：

| 模型文件 | 描述 | 使用位置 |
|----------|------|----------|
| `a_windy_day_safe.glb` | 风景场景模型 | index.html |
| `black_holesinister_titan_clockman.glb` | 黑洞/泰坦角色模型 | blackhole.html |

**替换模型：**

将新的 `.glb` 文件放入 `asset/` 目录，然后修改对应 HTML 文件中的加载路径：

```javascript
// 在 JavaScript 中找到类似代码
loader.load('asset/your-model.glb', function(gltf) {
    scene.add(gltf.scene);
});
```

---

## 🤝 贡献指南 | Contributing

我们欢迎所有形式的贡献！无论是新功能、Bug 修复、文档改进还是样式优化。

### 如何贡献

1. **Fork 本仓库**
   ```bash
   git clone https://github.com/yourusername/ArikaShow.git
   ```

2. **创建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **提交更改**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```

4. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **提交 Pull Request**

### 开发规范

#### Git Commit Message 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链变更

**示例：**
```
feat(blackhole): add gravitational lensing intensity control

Add slider UI to adjust the strength of gravitational lensing effect
in real-time rendering. Users can now customize the visual distortion.

Closes #42
```

#### 代码风格

- **HTML**: 使用 4 空格缩进，语义化标签优先
- **CSS**: BEM 命名规范，使用 CSS 变量管理主题色
- **JavaScript**: ES6+ 语法，函数级注释
- **响应式**: 移动优先原则

### 贡献领域

你可以从以下方面做出贡献：

- 🔧 **性能优化**: 减少 GPU 负载，优化粒子数量
- 🎨 **视觉改进**: 新增动画效果，优化配色方案
- 📱 **响应式适配**: 改善移动端体验
- ♿ **无障碍优化**: 添加 ARIA 标签，键盘导航支持
- 🌐 **国际化**: 添加多语言支持
- 📚 **文档完善**: 补充 API 文档，添加代码注释
- 🐛 **Bug 修复**: 修复已知问题

---

## 📋 待办事项 | Roadmap

- [ ] 添加暗色/亮色主题切换
- [ ] 实现 PWA 支持（离线访问）
- [ ] 添加更多 3D 交互场景
- [ ] 集成 Web Audio API 实现音频可视化
- [ ] 优化移动端性能表现
- [ ] 添加单元测试覆盖
- [ ] 构建组件化架构（可选迁移至 Vue/React）

---

## 📄 许可证 | License

本项目采用 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2024 ArikaShow Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📮 联系方式 | Contact

### 维护者信息

<div align="center">

**ArikaShow Team**

</div>

如有任何问题、建议或合作意向，欢迎通过以下方式联系我们：

| 方式 | 信息 |
|------|------|
| 📧 **Email** | 查看 [Email.html](Email.html) |
| 📱 **其他联系方式** | 查看 [contact call.html](contact call.html) |
| 💬 **Issues** | [GitHub Issues](https://github.com/yourusername/ArikaShow/issues) |
| 💡 **Discussions** | [GitHub Discussions](https://github.com/yourusername/ArikaShow/discussions) |

### 反馈渠道

- 🐛 **报告 Bug**: 请使用 GitHub Issues，并附上复现步骤和截图
- 💡 **功能建议**: 通过 Discussions 发起讨论或提交 Feature Request
- 📖 **文档问题**: 提交 PR 修正或提出改进建议
- 🤝 **合作咨询**: 通过邮件联系维护者

---

## 🙏 致谢 | Acknowledgments

感谢以下开源项目和社区的支持：

- [Three.js](https://threejs.org/) - 强大的 3D 渲染框架
- [GSAP](https://gsap.com/) - 专业级动画库
- [Lottie](https://lottiefiles.com/) - 矢量动画解决方案
- [Matter.js](https://brm.io/matter-js/) - 轻量级 2D 物理引擎
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [LordIcon](https://lordicon.com/) - 精美的图标动画库
- [Google Fonts](https://fonts.google.com/) - 优质字体资源

特别感谢所有为本项目贡献代码、设计和创意的开发者们！

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by [ArikaShow Team](mailto:contact@example.com)

</div>
