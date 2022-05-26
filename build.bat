@echo off
call npx electron-packager . --overwrite --asar --ignore=^/art --ignore=^/copy --ignore=^/original --ignore=^/copy --icon='./camera.ico'
xcopy ".\config.local.json" ".\Simple Photo Sync-win32-x64\config.local.json*"
TIMEOUT /T 5