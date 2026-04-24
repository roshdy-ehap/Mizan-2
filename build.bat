@echo off
chcp 65001 >nul
color 0B
title Mizan POS - Build

echo.
echo  ============================================
echo    Mizan POS - Build EXE
echo    النتيجة: EXE واحد بدون اي تثبيت
echo  ============================================
echo.

:: ── التحقق من Node.js ──
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Node.js مش مثبت
    echo.
    echo  حمله من: https://nodejs.org
    echo  اختر: LTS - ثم شغل ملف البناء مرة ثانية
    echo.
    pause & exit /b 1
)
echo  [OK] Node.js: 
node --version

:: ── تثبيت المكتبات ──
if not exist "node_modules\electron" (
    echo.
    echo  [INFO] تثبيت Electron - مرة واحدة فقط - قد ياخد 5 دقائق...
    npm install
    if errorlevel 1 (
        echo  [ERROR] فشل npm install
        echo  تاكد من الاتصال بالانترنت
        pause & exit /b 1
    )
    echo  [OK] تم تثبيت المكتبات
)

:: ── بناء الـ EXE ──
echo.
echo  [INFO] جاري البناء - انتظر 3-8 دقائق...
echo.

npx electron-builder --win portable --x64

echo.
if exist "dist\Mizan-POS-Setup.exe" (
    color 0A
    echo  ============================================
    echo   تم البناء بنجاح!
    echo.
    echo   الملف: dist\Mizan-POS-Setup.exe
    echo.
    echo   انقله لاي جهاز Windows وشغله مباشرة
    echo   لا يحتاج Python او اي تثبيت
    echo  ============================================
    start "" dist
) else (
    color 0C
    echo  [ERROR] لم ينشا الملف
    echo  ابحث عن اي سطر يبدا بـ Error في الاخراج اعلاه
)

pause
