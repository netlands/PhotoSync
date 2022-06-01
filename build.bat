@echo off
call npx electron-packager . --overwrite --asar --out=./dist/ --ignore=^/art --ignore=^/copy --ignore=^/original --ignore=^/copy --icon='./SimplePhotoSync.ico'
REM xcopy ".\config.local.json" ".\dist\Simple Photo Sync-win32-x64\config.local.json*"
TIMEOUT /T 5