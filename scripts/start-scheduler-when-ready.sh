#!/bin/bash

# Wait for Firebase emulator to be ready before starting the scheduler

echo "Waiting for Firebase emulator..."

max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
  # Check if Firestore emulator is responding
  if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Firebase emulator is ready!"
    echo "Starting scheduler..."

    # Change to tools directory and start scheduler
    cd tools && npm run scheduler
    exit 0
  fi

  sleep 2
  attempt=$((attempt + 1))

  # Show progress every 10 attempts
  if [ $((attempt % 10)) -eq 0 ]; then
    echo "Still waiting for emulator... ($attempt/$max_attempts)"
  fi
done

echo "❌ Firebase emulator failed to start after ${max_attempts} attempts"
exit 1
