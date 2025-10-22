import secrets
import string

# 1. Generate a secure, 32-byte (256-bit) random string suitable for a JWT secret
# The 'token_urlsafe' function uses URL-safe base64 encoding.
jwt_secret = secrets.token_urlsafe(32)

# 2. Generate a long, complex, random string that includes letters, digits, and symbols
# This is a good general-purpose secret key
characters = string.ascii_letters + string.digits + string.punctuation
general_secret = ''.join(secrets.choice(characters) for i in range(64)) # 64 characters long

print("--- Generated Secrets ---")
print(f"JWT Secret (32 bytes): {jwt_secret}")
print(f"General Secret (64 chars): {general_secret}")