@echo off
REM Build the static export from a path whose casing matches %USERPROFILE%.
REM See dev.cmd for why this is needed on this machine. Netlify (Linux) is not
REM affected and just runs `npm run build`.
cd /d "%USERPROFILE%\Desktop\lokoLM\docs" || goto :err
call npm run build
goto :eof
:err
echo Could not cd to "%USERPROFILE%\Desktop\lokoLM\docs". Adjust the path in build.cmd if you moved the project.
exit /b 1
