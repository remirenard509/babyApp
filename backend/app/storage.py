import os
import uuid
from typing import Optional
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")

supabase_client: Optional[Client] = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Erreur initialisation Supabase Client: {e}")

async def upload_file_to_storage(file_bytes: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
    """
    Téléverse un fichier soit vers Supabase Storage si configuré,
    soit vers le dossier local /uploads en fallback (mode docker local).
    """
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"

    if supabase_client:
        # Upload vers Supabase Storage
        try:
            supabase_client.storage.from_(SUPABASE_BUCKET).upload(
                path=unique_name,
                file=file_bytes,
                file_options={"content-type": content_type}
            )
            # Récupération de l'URL publique
            public_url_res = supabase_client.storage.from_(SUPABASE_BUCKET).get_public_url(unique_name)
            return public_url_res
        except Exception as e:
            print(f"Supabase upload error: {e}")
            raise e

    # Fallback local (Docker / local dev)
    upload_dir = "/tmp/uploads" if os.name != "nt" and not os.access(".", os.W_OK) else os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except OSError:
        upload_dir = "/tmp"
    local_path = os.path.join(upload_dir, unique_name)
    with open(local_path, "wb") as f:
        f.write(file_bytes)

    return f"/uploads/{unique_name}"

