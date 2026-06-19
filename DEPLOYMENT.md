# GitHub Pages 部署指南

本指南将帮助你将审核人天计算工具部署到 GitHub Pages，实现完全免费的在线访问。

## 📋 前置要求

- GitHub 账号（免费注册：https://github.com）
- Git 命令行工具
- Node.js 20+ 和 pnpm

## 🚀 快速部署（推荐）

### 步骤 1：创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 填写信息：
   - Repository name: `audit-manday-calculator`（或其他名称）
   - Description: 审核人天计算工具
   - 选择 **Public**（公开仓库）
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

### 步骤 2：使用部署脚本

在项目根目录执行：

```bash
# 赋予脚本执行权限
chmod +x deploy-gh-pages.sh

# 运行部署脚本（替换为你的 GitHub 用户名和仓库名）
bash deploy-gh-pages.sh 你的用户名 audit-manday-calculator
```

### 步骤 3：启用 GitHub Pages

1. 进入你的仓库页面
2. 点击 **Settings**（设置）
3. 左侧菜单选择 **Pages**
4. 在 "Build and deployment" 部分：
   - Source 选择：**Deploy from a branch**
   - Branch 选择：**gh-pages**
   - 文件夹选择：**/ (root)**
5. 点击 **Save**

### 步骤 4：等待部署完成

- GitHub 会自动构建和部署（通常需要 1-2 分钟）
- 刷新 Pages 页面，会看到部署成功的提示
- 访问地址：`https://你的用户名.github.io/audit-manday-calculator/`

## 🔧 手动部署（高级）

如果脚本部署失败，可以手动操作：

```bash
# 1. 构建静态文件
pnpm install
pnpm build

# 2. 创建 gh-pages 分支
git checkout -b gh-pages

# 3. 添加 .nojekyll 文件
touch .nojekyll

# 4. 提交 out 目录
git add -f out/ .nojekyll
git commit -m "Deploy to GitHub Pages"

# 5. 推送到 GitHub
git remote add origin https://github.com/你的用户名/仓库名.git
git push -f origin gh-pages

# 6. 切回主分支
git checkout main
```

## 🌐 自定义域名（可选）

如果你想使用自己的域名：

1. 在项目根目录创建 `CNAME` 文件：
   ```bash
   echo "yourdomain.com" > CNAME
   ```

2. 在域名服务商处添加 DNS 记录：
   - 类型：CNAME
   - 名称：@ 或 www
   - 值：`你的用户名.github.io`

3. 在 GitHub Pages 设置中填写自定义域名

## 🔄 更新部署

当代码有更新时：

```bash
# 1. 提交代码更改
git add .
git commit -m "Update: 修复XXX问题"
git push origin main

# 2. 重新部署
bash deploy-gh-pages.sh 你的用户名 audit-manday-calculator
```

## ❓ 常见问题

### Q1: 部署后页面 404？
- 检查是否选择了正确的分支（gh-pages）
- 检查文件夹是否选择了 `/ (root)`
- 等待 1-2 分钟后刷新

### Q2: 样式丢失或功能异常？
- 检查 `next.config.ts` 中的 `output: 'export'` 是否保留
- 检查 `basePath` 是否正确设置为仓库名

### Q3: 图片无法显示？
- 确保图片放在 `public` 目录下
- 使用绝对路径引用：`/仓库名/图片.png`

### Q4: 如何删除部署？
- 在仓库 Settings → Pages 中关闭 Pages 功能
- 或删除 gh-pages 分支

## 📊 部署后的访问统计

GitHub Pages 提供基础的访问统计：

1. 进入仓库页面
2. 点击 **Insights** → **Traffic**
3. 查看访问量、来源等数据

## 🔒 安全说明

- GitHub Pages 是静态托管，所有计算在浏览器完成
- 没有服务器，无需担心数据泄露
- 代码完全开源，可接受社区审查

## 💡 替代方案

如果 GitHub Pages 不适合你，还可以考虑：

- **Vercel**：https://vercel.com（免费，支持自动部署）
- **Netlify**：https://netlify.com（免费，支持表单等功能）
- **Cloudflare Pages**：https://pages.cloudflare.com（免费，全球CDN）

## 📞 获取帮助

如果部署过程中遇到问题：

1. 查看 GitHub Pages 官方文档：https://docs.github.com/pages
2. 检查 GitHub Actions 日志（如果使用 Actions 部署）
3. 在项目中提交 Issue

---

**部署成功后，你就可以把链接分享给任何人使用了！** 🎉
