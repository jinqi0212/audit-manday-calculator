#!/bin/bash

# GitHub Pages 部署脚本
# 使用方法: bash deploy-gh-pages.sh 你的GitHub用户名 仓库名

set -e

USERNAME=$1
REPO=$2

if [ -z "$USERNAME" ] || [ -z "$REPO" ]; then
    echo "使用方法: bash deploy-gh-pages.sh <GitHub用户名> <仓库名>"
    echo "示例: bash deploy-gh-pages.sh john-doe audit-manday-calculator"
    exit 1
fi

echo "🚀 开始部署到 GitHub Pages..."

# 1. 构建静态文件
echo "📦 构建静态文件..."
pnpm build

# 2. 检查是否有 git 仓库
if [ ! -d .git ]; then
    echo "📝 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# 3. 创建或更新 gh-pages 分支
echo "🌿 准备 gh-pages 分支..."
if git rev-parse --verify --quiet gh-pages; then
    git branch -D gh-pages
fi

git checkout -b gh-pages

# 4. 添加 .nojekyll 文件（GitHub Pages 需要）
touch .nojekyll

# 5. 创建 CNAME 文件（如果使用自定义域名）
# echo "yourdomain.com" > CNAME

# 6. 提交 out 目录内容
echo "📤 提交静态文件..."
git add -f out/
git add .nojekyll

git commit -m "Deploy to GitHub Pages"

# 7. 推送到 GitHub
echo "🚀 推送到 GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/$USERNAME/$REPO.git
git push -f origin gh-pages

# 8. 切回主分支
git checkout - 2>/dev/null || git checkout main

echo ""
echo "✅ 部署完成！"
echo ""
echo "📌 下一步操作："
echo "1. 进入仓库: https://github.com/$USERNAME/$REPO"
echo "2. Settings → Pages"
echo "3. Source 选择: Deploy from a branch"
echo "4. Branch 选择: gh-pages，文件夹选择: / (root)"
echo "5. 保存后等待 1-2 分钟"
echo ""
echo "🌐 访问地址: https://$USERNAME.github.io/$REPO/"
