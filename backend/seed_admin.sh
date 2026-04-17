#!/bin/bash

# Auth token URL
TOKEN=$(curl -s -X POST "http://127.0.0.1:8090/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@manakher.com","password":"Admin@12345"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Create users collection if needed
curl -s -X GET "http://127.0.0.1:8090/api/collections/users" \
  -H "Authorization: Bearer $TOKEN" | head -20
