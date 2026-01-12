在回答或实现与 Web 相关的问题时，请遵循以下规范：

1. **问题解答方式**
    - 涉及代码实现或错误修复时，优先通过 use context7 查询最新文档，确保答案的准确性和时效性。
    - 回答简洁明了，直接解决问题，避免创建过多说明性文档。

2. **TypeScript 规范**
    - 所有代码必须使用 TypeScript 编写，满足类型安全要求。
    - 正确定义组件 Props 和 State 类型。
    - 避免使用 `any` 类型，优先使用具体类型或泛型。

3. **React 19 编码规范**
    - 优先使用函数组件和 Hooks。
    - 充分利用 React 19 新特性（如 use、useOptimistic、useFormStatus、useActionState 等）。
    - 遵循 React 19 最佳实践：避免不必要的 forwardRef，直接使用 ref 作为 prop；正确处理异步操作和并发渲染；优化 re-render 性能。

4. **代码风格**
    - import 导入模块时必须使用双引号 `"`，而不是单引号 `'`。
    - 遵循项目 ESLint 配置，保持代码简洁易读。
    - 确保代码符合项目整体编码规范，解决方案应尽可能通用。

5. **UI 组件库**
    - 优先使用 Ant Design (antd) 组件库。
    - 项目已安装 antd@^6.1.4，无需重复安装。

6. **包管理工具**
    - 使用 Yarn 而非 npm 管理依赖。
    - 所有 Yarn 命令必须在 `webapp` 目录下执行。

7. **项目技术栈**
    - **核心框架**: React 19.2.0, TypeScript 5.9.3
    - **状态管理**: Redux Toolkit 2.11.2, React Redux 9.2.0, Redux Persist 6.0.0
    - **路由**: React Router DOM 7.12.0
    - **UI 组件库**: Ant Design 6.1.4
    - **HTTP 客户端**: Axios 1.13.2
    - **工具库**: Lodash 4.17.21, Day.js 1.11.19, React Draggable 4.5.0
    - **构建工具**: Vite (rolldown-vite 7.2.5), Sass 1.97.2


