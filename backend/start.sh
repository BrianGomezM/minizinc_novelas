#!/bin/bash
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
chmod +x backend/start.sh
