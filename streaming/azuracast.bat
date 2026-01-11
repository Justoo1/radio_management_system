@echo off
setlocal enabledelayedexpansion

:: AzuraCast Management Script for RMS Development
:: Usage: azuracast.bat [command]

set COMPOSE_FILE=%~dp0docker-compose.yml

if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="shell" goto shell
if "%1"=="reset" goto reset
if "%1"=="backup" goto backup
if "%1"=="help" goto help
goto help

:start
echo.
echo Starting AzuraCast...
echo.
docker compose -f "%COMPOSE_FILE%" up -d
echo.
echo AzuraCast is starting up. This may take 2-3 minutes on first run.
echo.
echo Access URLs:
echo   Web Interface: http://localhost:8080
echo   Stream URL:    http://localhost:8000/radio.mp3
echo.
echo Admin Credentials (first run only):
echo   Email:    admin@rms.local
echo   Password: rmsadmin123
echo.
echo Run 'azuracast.bat logs' to watch startup progress.
goto end

:stop
echo.
echo Stopping AzuraCast...
docker compose -f "%COMPOSE_FILE%" down
echo AzuraCast stopped.
goto end

:restart
echo.
echo Restarting AzuraCast...
docker compose -f "%COMPOSE_FILE%" restart
echo AzuraCast restarted.
goto end

:status
echo.
echo AzuraCast Status:
echo.
docker compose -f "%COMPOSE_FILE%" ps
echo.
docker compose -f "%COMPOSE_FILE%" exec azuracast curl -s http://localhost/api/status 2>nul || echo Container not running or still starting up...
goto end

:logs
echo.
echo Showing AzuraCast logs (Ctrl+C to exit)...
echo.
docker compose -f "%COMPOSE_FILE%" logs -f azuracast
goto end

:shell
echo.
echo Opening shell in AzuraCast container...
echo.
docker compose -f "%COMPOSE_FILE%" exec azuracast bash
goto end

:reset
echo.
echo WARNING: This will delete ALL AzuraCast data including stations, media, and settings!
echo.
set /p confirm=Are you sure? (yes/no):
if /i "!confirm!"=="yes" (
    echo.
    echo Stopping and removing containers...
    docker compose -f "%COMPOSE_FILE%" down -v
    echo.
    echo Removing volumes...
    docker volume rm rms_azuracast_station_data rms_azuracast_backups rms_azuracast_db_data rms_azuracast_sftpgo_data 2>nul
    echo.
    echo AzuraCast has been reset. Run 'azuracast.bat start' to set up fresh.
) else (
    echo Reset cancelled.
)
goto end

:backup
echo.
echo Creating AzuraCast backup...
docker compose -f "%COMPOSE_FILE%" exec azuracast /var/azuracast/www/bin/console azuracast:backup backup.zip
echo Backup created in container. Use 'docker cp' to extract.
goto end

:help
echo.
echo AzuraCast Management Script for RMS Development
echo.
echo Usage: azuracast.bat [command]
echo.
echo Commands:
echo   start    - Start AzuraCast container
echo   stop     - Stop AzuraCast container
echo   restart  - Restart AzuraCast container
echo   status   - Show container status
echo   logs     - Show container logs (follow mode)
echo   shell    - Open bash shell in container
echo   reset    - Remove all data and start fresh
echo   backup   - Create a backup
echo   help     - Show this help message
echo.
echo First Run:
echo   1. Run 'azuracast.bat start'
echo   2. Wait 2-3 minutes for initialization
echo   3. Open http://localhost:8080
echo   4. Login with admin@rms.local / rmsadmin123
echo   5. Create your first station
echo   6. Get API key from My Account ^> API Keys
echo.
goto end

:end
endlocal
