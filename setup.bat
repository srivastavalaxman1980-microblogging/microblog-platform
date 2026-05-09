@echo off
echo ========================================
echo MicroBlog Platform Setup
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

REM Check PostgreSQL
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL not found in PATH
    echo Please ensure PostgreSQL is installed
)

echo [1/6] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend installation failed
    exit /b 1
)

echo [2/6] Installing frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend installation failed
    exit /b 1
)

echo [3/6] Creating .env files...
cd ../backend
if not exist .env (
    echo NODE_ENV=development > .env
    echo PORT=5000 >> .env
    echo DB_HOST=localhost >> .env
    echo DB_USER=postgres >> .env
    echo DB_PASSWORD=your_password >> .env
    echo DB_NAME=microblogging_dev >> .env
    echo JWT_SECRET=your_secret_key_here >> .env
    echo [INFO] Created .env file - Please update database credentials
)

echo [4/6] Setting up database...
echo Please ensure PostgreSQL is running
echo Run the following commands in psql:
echo   CREATE DATABASE microblogging_dev;
echo   \i database-schema.sql
echo.

echo [5/6] Running migrations...
call npx sequelize-cli db:migrate
if %errorlevel% neq 0 (
    echo [WARNING] Migration failed - Database may not be configured
)

echo [6/6] Seeding sample data...
call npx sequelize-cli db:seed:all
if %errorlevel% neq 0 (
    echo [WARNING] Seeding failed - Database may not be configured
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application:
echo   1. Backend: cd backend && npm run dev
echo   2. Frontend: cd frontend && npm run dev
echo.
echo Open http://localhost:3000 in your browser
echo.
pause