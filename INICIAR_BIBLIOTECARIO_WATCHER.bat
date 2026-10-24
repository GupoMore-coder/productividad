@echo off
title Vigilante del Buzon - Biblioteca Medica de Ortopedia
echo ============================================================================
echo   BIBLIOTECARIO WATCHER DAEMON - VIGILANCIA PERMANENTE DE BUZON
echo   Monitoreando: H:\Mi unidad\Informacion Ortopedia\_BIBLIOTECARIO
echo ============================================================================
echo.
echo Presione Ctrl+C si desea detener la vigilancia.
echo.
cd /d "%~dp0"
node bibliotecario_engine/mailbox_watcher.cjs
pause
