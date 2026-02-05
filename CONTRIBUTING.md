# Contributing to @openclaw/xiaozhi

感谢您对 `@openclaw/xiaozhi` 插件的贡献！

## 开发环境设置

### 系统要求

- Node.js >= 22.0.0
- npm 或 pnpm
- Git

### 克隆仓库

```bash
git clone https://github.com/openclaw/xiaozhi-openclaw-plugin.git
cd xiaozhi-openclaw-plugin
```

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动 TypeScript 编译监听模式
npm run dev

# 在另一个终端运行测试
npm test -- --watch
```

## 项目结构

```
xiaozhi-openclaw-plugin/
├── src/                 # 源代码
│   ├── client/         # WebSocket 客户端
│   ├── config/         # 配置管理
│   └── tools/          # 工具实现
├── test/               # 测试文件
├── dist/               # 构建输出（自动生成）
└── package.json
```

## 提交代码

### 分支策略

- `main` - 稳定版本
- `develop` - 开发分支

### 提交规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
test: 添加测试
refactor: 重构代码
chore: 构建/工具链更新
```

### Pull Request 流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### PR 要求

- 所有测试必须通过
- 代码覆盖率不应降低
- 需要更新相关文档
- PR 描述需清楚说明更改内容和原因

## 测试

```bash
# 运行所有测试
npm test

# 运行带覆盖率的测试
npm run test:coverage

# 运行特定测试文件
npm test -- test/protocol.test.ts
```

## 构建

```bash
npm run build
```

构建输出将生成在 `dist/` 目录中。

## 发布

发布由维护者通过 GitHub Actions 自动完成：

1. 合并 PR 到 `main` 分支
2. GitHub Actions 自动运行 CI
3. CI 通过后自动发布到 npm

## 报告问题

请在 [GitHub Issues](https://github.com/openclaw/xiaozhi-openclaw-plugin/issues) 中报告问题。

请包含：

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（Node.js 版本、操作系统等）
- 相关日志

## 行为准则

- 尊重所有贡献者
- 使用友好和包容的语言
- 接受建设性批评
- 关注对社区最有利的事情

## 许可证

通过贡献代码，您同意您的贡献将根据项目的 [MIT 许可证](LICENSE) 进行许可。
