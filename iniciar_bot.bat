@echo off
cd /d "C:\Users\kaleb\Downloads\HellDevs Bots\kensai-bot"
call pm2 start index.js --name "kensai-bot"
call pm2 save
