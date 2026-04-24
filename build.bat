@echo off
REM ============================================
REM Mizan POS - Build Script
REM نظام ميزان لنقاط البيع - سكريبت البناء
REM ============================================

chcp 65001 >nul
color 0B
title Mizan POS - Build System

echo.
echo  ╔════════════════════════════════════════╗
echo  ║   Mizan POS - Build EXE                ║
echo  ║   نظام ميزان - بناء التطبيق           ║
echo  ║   Version 3.1.0                        ║
echo  ╚════════════════════════════════════════╝
echo.

REM ── التحقق من Node.js ──
echo  [*] التحقق من Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  ✗ خطأ: Node.js غير مثبت
    echo.
    echo  الحل:
    echo  1. اذهب إلى https://nodejs.org
    echo  2. حمّل LTS Version
    echo  3. ثبت البرنامج
    echo  4. أعد تشغيل هذا الملف
    echo.
    pause & exit /b 1
)
echo  ✓ Node.js موجود: 
node --version

REM ── التحقق من npm ──
echo.
echo  [*] التحقق من npm...
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ✗ خطأ: npm غير موجود
    pause & exit /b 1
)
echo  ✓ npm موجود: 
npm --version

REM ── تثبيت المكتبات إن لزم الأمر ──
echo.
echo  [*] فحص المكتبات...
if not exist "node_modules\electron" (
    echo  ! المكتبات غير موجودة - جاري التثبيت (قد يأخذ 5-10 دقائق)...
    echo.
    npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo  ✗ خطأ: فشل npm install
        echo  - تحقق من الاتصال بالانترنت
        echo  - حاول مرة أخرى
        echo.
        pause & exit /b 1
    )
    echo  ✓ تم تثبيت المكتبات بنجاح
) else (
    echo  ✓ المكتبات موجودة
)

REM ── بناء الـ EXE ──
echo.
echo  [*] جاري البناء (هذا قد يأخذ 5-15 دقائق)...
echo.

npx electron-builder --win portable --x64

echo.
REM ── التحقق من نجاح البناء ──
if exist "dist\Mizan-POS-*.exe" (
    color 0A
    for /f "tokens=*" %%A in ('dir /b dist\Mizan-POS-*.exe 2^>nul') do set "filename=%%A"
    
    echo  ╔════════════════════════════════════════╗
    echo  ║  ✓ تم البناء بنجاح!                    ║
    echo  ╚════════════════════════════════════════╝
    echo.
    echo  الملف: dist\!filename!
    echo.
    echo  المعلومات:
    echo  - نوع الملف: EXE محمول
    echo  - لا يحتاج تثبيت
    echo  - يعمل على أي جهاز Windows 7+
    echo  - يمكنك نسخه وتشغيله مباشرة
    echo.
    echo  الخطوة التالية:
    echo  1. انسخ الملف لأي مكان
    echo  2. شغّله مباشرة من أي جهاز Windows
    echo  3. لا تحتاج تثبيت Python أو أي شيء آخر
    echo.
    
    REM فتح مجلد dist
    echo  [*] فتح مجلد الملفات...
    start "" dist
    
) else (
    color 0C
    echo  ✗ خطأ: فشل البناء
    echo.
    echo  أسباب محتملة:
    echo  1. خطأ في الملفات (اطلب على المطور)
    echo  2. مشكلة في Node.js (أعد التثبيت)
    echo  3. خطأ في المكتبات (احذف node_modules وأعد npm install)
    echo.
    echo  ابحث في الرسائل أعلاه عن كلمة "Error"
    echo.
)

echo.
pause
