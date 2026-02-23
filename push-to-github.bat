@echo off
echo ========================================
echo   绩效管理系统 - GitHub 推送脚本
echo ========================================
echo.

echo 步骤1: 请在浏览器中打开 https://github.com/new
echo 步骤2: 创建一个新仓库，命名为: performance-system
echo 步骤3: 不要勾选任何选项，直接点击 "Create repository"
echo 步骤4: 复制仓库URL，然后在这里粘贴:
echo.

set /p REPO_URL=请输入仓库URL (例如: https://github.com/yourname/performance-system.git): 

echo.
echo 正在添加远程仓库并推送代码...
cd /d "%~dp0"

git remote add origin %REPO_URL%
git push -u origin master

echo.
echo ========================================
echo   推送完成！
echo ========================================
echo.
echo 下一步:
echo 1. 访问 https://vercel.com 部署前端
echo 2. 访问 https://railway.app 部署后端
echo.
pause
