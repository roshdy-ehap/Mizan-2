@echo off
chcp 65001 >nul
title Mizan POS - Dev Mode

if not exist "node_modules\electron" (
    echo Installing dependencies...
    npm install
)

echo Starting Mizan POS...
npx electron .
