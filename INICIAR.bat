@echo off
title OBM Mega Analytics v2.0
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js 18 ou superior.
  pause
  exit /b 1
)
node server.js
pause
