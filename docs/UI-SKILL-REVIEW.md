# V9.1.4 UI Skill 审校记录

## 采用的 GitHub Skill

### 1. Frontend UI Engineering

来源：`addyosmani/agent-skills/skills/frontend-ui-engineering/SKILL.md`

采用内容：

- 移动优先，而不是把桌面布局简单压窄。
- 避免通用 AI 风格和无意义装饰。
- 视觉系统、交互状态、无障碍和性能同时验收。
- 组件状态必须覆盖默认、选中、禁用、加载和错误。

### 2. Web Design Guidelines

来源：`vercel-labs/agent-skills` 的 `web-design-guidelines`

采用内容：

- 语义按钮和清晰的键盘焦点。
- 弹层焦点锁定和焦点恢复。
- 移动端触控面积、内容溢出和动画降级。
- 避免只依赖 hover 表达可操作性。

### 3. Mobile App UI Design

来源：`ceorkm/mobile-app-ui-design`

采用内容：

- 4pt/8pt 间距系统。
- 主要操作放在拇指容易触达的底部区域。
- 触控目标不低于约 44px。
- 小屏文字不压缩到不可读，而是改变排版结构。

### 4. Design Review / Plan Design Review

来源：`garrytan/gstack`

采用内容：

- 先检查真实用户路径，再检查美观。
- 移动布局应独立成立，而不是堆叠桌面布局。
- 明确所有过渡状态、空状态、错误状态和返回路径。
- 页面文案使用产品语言，不使用设计解释语言。

### 5. GitHub Primer Accessibility Checklist

采用内容：

- 状态不能只依靠颜色区分。
- 交互控件使用明确名称和可见焦点。
- 弹层支持键盘关闭和焦点管理。
- 小屏、缩放和高对比环境保持可用。

## 未直接采用

- 未引入 React、Vue、Tailwind 或完整组件库。
- 未套用 Glassmorphism、Material 或其他现成视觉主题。
- 未加入依赖网络的 UI 运行库。

原因：项目当前是轻量原生 ES Module PWA，设计升级应保持离线能力、包体和现有架构稳定。
