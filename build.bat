@echo off
call npx electron-packager . --overwrite --asar --out=./dist/ --ignore=^/art --ignore=^/copy --ignore=^/original --ignore=^/copy --icon='./SimplePhotoSync.ico'
powershell Compress-Archive -Path '.\dist\Simple Photo Sync-win32-x64\*' -DestinationPath '.\dist\Simple Photo Sync-win32-x64.zip'
REM files for local testing
xcopy ".\config.local.json" ".\dist\Simple Photo Sync-win32-x64\config.local.json*"
xcopy ".\reference.JPG" ".\dist\Simple Photo Sync-win32-x64\reference.JPG*"
TIMEOUT /T 5