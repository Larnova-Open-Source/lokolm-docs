@echo off
REM Launch the Next.js dev server from a path whose casing matches %USERPROFILE%.
REM This machine exposes the home folder under several casings (USER/User/user/
REM Mahmud); launching from a mismatched casing makes Node/webpack load React
REM twice ("Invalid hook call"). Using %USERPROFILE% guarantees one casing.
cd /d "%USERPROFILE%\Desktop\lokoLM\docs" || goto :err
call npm run dev
goto :eof
:err
echo Could not cd to "%USERPROFILE%\Desktop\lokoLM\docs". Adjust the path in dev.cmd if you moved the project.
exit /b 1
