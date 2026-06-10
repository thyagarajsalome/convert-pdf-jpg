@echo off
echo ====================================================
echo   🚀 Starting Automated Version Bump & Git Push
echo ====================================================

:: Run the version bumper script to increment the version number in the HTML files
node "%~dp0version-bumper.js"

:: Retrieve the new version from version.json
for /f "usebackq tokens=*" %%a in (`powershell -Command "(Get-Content '%~dp0version.json' | ConvertFrom-Json).version"`) do set VERSION=%%a

echo Staging all project changes...
git add .

echo Committing updates for version v%VERSION%...
git commit -m "Build: bump version to v%VERSION%"

echo Pushing changes to GitHub (Cloudflare will auto-deploy)...
git push

echo.
echo ====================================================
echo   🎉 Success! Project pushed to GitHub.
echo   🌐 Live Version is now: v%VERSION%
echo   🕒 Cloudflare Pages will update the site in 10s.
echo ====================================================
pause
