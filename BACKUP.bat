@echo off

REM move into the backups directory
CD C:\Node\Backups

REM Create a file name for the database output which contains the date and time. Replace any characters which might cause an issue.
set filename=SnookerDB %date% %time%
set filename=%filename:/=-%
set filename=%filename: =__%
set filename=%filename:.=_%
set filename=%filename::=-%

REM Export the database
echo Running backup "%filename%"
C:\Programme\MongoDB\Server\3.4\bin\mongodump -h ds121345.mlab.com:21345 -d heroku_9kxkztcf --excludeCollection=sessions --excludeCollection=objectlabs-system --excludeCollection=objectlabs-system.admin.collections -u heroku_9kxkztcf -p q5vmv2vq4v6u7rmhafpiqu1dtd -o %filename%

REM ZIP the backup directory
echo Running backup "%filename%"
C:\Programme\7-Zip\7z.exe a -tzip "%filename%.zip" "%filename%"

REM Delete the backup directory (leave the ZIP file). The /q tag makes sure we don't get prompted for questions 
echo Deleting original backup directory "%filename%"
rmdir "%filename%" /s /q

REM Delete all files, but 5 youngest
for /f "skip=5 eol=: delims=" %%F in ('dir /b /o-d /a-d *.zip') do @del "%%F"
echo BACKUP COMPLETE