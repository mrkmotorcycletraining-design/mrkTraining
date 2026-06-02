#!/usr/bin/env pwsh
# Start script for MrkTraining Backend

Write-Host "Starting MrkTraining Backend..." -ForegroundColor Green

# Navigate to the project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if Gradle wrapper exists
if (-not (Test-Path ".\gradlew.bat")) {
    Write-Host "Error: gradlew.bat not found. Please ensure you're in the project root." -ForegroundColor Red
    exit 1
}

# Run the Spring Boot application using Gradle
Write-Host "Running: .\gradlew.bat bootRun" -ForegroundColor Cyan
.\gradlew.bat bootRun
