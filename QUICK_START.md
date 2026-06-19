# 🚀 快速部署到 GitHub Pages（3分钟完成）

## 方案一：自动部署（最简单）

### 1. 创建 GitHub 仓库
- 访问 https://github.com/new
- 仓库名：`audit-manday-calculator`
- 选择 **Public**
- 点击 **Create repository**

### 2. 推送代码到 GitHub
```bash
# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 关联远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/audit-manday-calculator.git
git branch -M main
git push -u origin main
```

### 3. 启用 GitHub Pages
- 进入仓库 → **Settings** → **Pages**
- Source 选择：**GitHub Actions**
- 保存后会自动部署

### 4. 等待部署完成
- 约 1-2 分钟后刷新页面
- 访问：`https://你的用户名.github.io/audit-manday-calculator/`

**后续更新代码时，只需 `git push`，GitHub 会自动重新部署！**

---

## 方案二：手动部署（备选）

如果自动部署失败，使用脚本手动部署：

```bash
bash deploy-gh-pages.sh 你的用户名 audit-manday-calculator
```

然后在 Settings → Pages 中选择：
- Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/ (root)**

---

## ✅ 部署成功标志

- 访问链接能正常打开页面
- 所有功能（单体系、多体系、IMS）都能正常使用
- 页面样式和计算结果正确

---

## 📝 注意事项

1. **仓库必须是 Public**（GitHub Pages 免费版只支持公开仓库）
2. **首次部署需要 1-2 分钟**，请耐心等待
3. **代码更新后自动部署**，无需手动操作
4. **完全免费**，无需服务器费用

---

## 🆘 遇到问题？

查看详细部署指南：[DEPLOYMENT.md](./DEPLOYMENT.md)
