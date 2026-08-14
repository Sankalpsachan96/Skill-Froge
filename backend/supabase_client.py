import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SECRET_KEY")

if not url:
    raise RuntimeError("SUPABASE_URL missing")

if not key:
    raise RuntimeError("SUPABASE_SECRET_KEY missing")

sb = create_client(url, key)

print("✅ Supabase connected")