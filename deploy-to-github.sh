#!/bin/bash
# 一键部署到 GitHub Pages
# 使用方法：在你的电脑上执行 bash deploy-to-github.sh

set -e

echo "🚀 开始部署到 GitHub Pages..."

# 配置
GITHUB_USER="jinqi0212"
REPO_NAME="audit-manday-calculator"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    echo "❌ 未安装 git，请先安装 git"
    exit 1
fi

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 当前目录不是项目目录，请先 cd 到项目目录"
    exit 1
fi

echo "📦 步骤 1/5: 初始化 Git 仓库..."
git init
git add .
git commit -m "Initial commit: 管理体系认证审核人天计算工具"

echo "🔗 步骤 2/5: 关联 GitHub 仓库..."
git remote add origin ${REPO_URL}
git branch -M main

echo "📤 步骤 3/5: 推送代码到 GitHub..."
git push -u origin main

echo "✅ 步骤 4/5: 代码已推送成功！"
echo ""
echo "📋 步骤 5/5: 启用 GitHub Pages（需要手动操作）"
echo ""
echo "请按以下步骤操作："
echo "1. 打开浏览器访问: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "2. 点击 Settings（设置）"
echo "3. 左侧菜单点击 Pages"
echo "4. Source 选择: GitHub Actions"
echo "5. 保存后等待 1-2 分钟"
echo ""
echo "🎉 部署完成后访问："
echo "   https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo ""
echo "📖 详细文档请查看 DEPLOYMENT.md"
