@echo off
chcp 65001 >nul
cd /d "%~dp0.."

echo.
echo === talk-dojo dev (LAN) — http://0.0.0.0:3000 ===
echo 手机与电脑同一 Wi-Fi，浏览器打开: http://你的IPv4:3000
echo 本机 IPv4:
echo.
ipconfig | findstr /i "IPv4"
echo.
echo 按 Ctrl+C 停止服务
echo.

npm run dev:lan
