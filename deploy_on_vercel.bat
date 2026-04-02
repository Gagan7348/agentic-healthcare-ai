@echo off
echo 🚀 Agentic Healthcare AI - Professional Cloud Deployment
echo --------------------------------------------------------
echo 1. Pre-deployment Clinical Build...
cd frontend
call npm run build
echo.
echo 2. Final Cloud Sync (Vercel)...
echo --------------------------------------------------------
echo [Action required: If prompted, please login to your Vercel account in the terminal]
echo.
npx vercel dist --prod --name agentic-healthcare-ai
echo.
echo ✅ Deployment Complete!
echo You can now access your dashboard via the Vercel link above.
pause
