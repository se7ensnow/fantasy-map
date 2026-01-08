import secrets

def generate_share_id(nbytes: int = 24) -> str:
    return secrets.token_urlsafe(nbytes)