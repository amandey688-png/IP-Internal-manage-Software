#!/usr/bin/env python3
"""Test registration directly - run: python test_register.py"""
import urllib.request
import json

# Test simple endpoint first
print("1. Testing /auth/register-test (no Supabase)...")
try:
    req = urllib.request.Request("http://127.0.0.1:8000/auth/register-test", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as r:
        print(f"   Status: {r.status} - OK")
except urllib.error.HTTPError as e:
    print(f"   Status: {e.code} - {e.read().decode()[:200]}")
except Exception as e:
    print(f"   Error: {e}")

print("\n2. Testing /auth/register (with Supabase)...")
url = "http://127.0.0.1:8000/auth/register"
payload = {"full_name": "Test User", "email": "testuser999@example.com", "password": "Test123!@#"}
data = json.dumps(payload).encode()

print("Testing registration...")
print(f"POST {url}")
try:
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as r:
        print(f"Status: {r.status}")
        print(f"Response: {r.read().decode()[:500]}")
        print("SUCCESS - Registration works!")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Response: {e.read().decode()[:500]}")
    print("FAILED - Check the detail above")
except Exception as e:
    print(f"Error: {e}")
    print("Is the backend running? Start: uvicorn app.main:app --reload --host 127.0.0.1 --port 8000")
