@echo off
set "FOLDER=C:\Users\evanb\Desktop\Mes-Extensions\detecte-Music-go-discord\app"
set "CMD=npm start"

powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"%FOLDER%\" && %CMD%' -Verb RunAs"
