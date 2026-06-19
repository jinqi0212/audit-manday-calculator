# 审核人天计算工具

管理体系认证审核人天计算工具，支持单体系、多体系和IMS结合审核的人天计算。

## 功能特性

- **单体系计算**：支持QMS/EMS/OHSMS/EnMS单体系人天计算
- **多体系计算**：支持多体系结合审核，按MSWM11-02文件6.9.2规定计算
- **IMS结合审核**：审核组能力计算 + 整合程度矩阵 → 减少量计算

## 部署到GitHub Pages

### 方式一：自动部署（推荐）

1. **创建GitHub仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

2. **启用GitHub Pages**
   - 进入仓库 → Settings → Pages
   - Source 选择：GitHub Actions
   - 保存后会自动部署

3. **访问地址**
   - 部署完成后访问：`https://你的用户名.github.io/仓库名/`

### 方式二：手动部署

1. **构建静态文件**
   ```bash
   pnpm install
   pnpm build
   ```

2. **部署out目录**
   - 使用 `gh-pages` 分支
   - 或使用其他静态托管服务（Vercel、Netlify等）

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 技术栈

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

## 计算依据

- MSWM11-02《审核人天数确定指南》
- MSWM102-2《能源管理体系审核人天数确定指南》

## 更新日志

计算公式和数据表维护在以下文件中：
- `src/lib/manday-calculator.ts` - 核心计算逻辑
- `src/data/lookup-tables.ts` - 数据表
- `src/app/multi/page.tsx` - 多体系合并计算
- `src/app/ims/page.tsx` - IMS结合审核
