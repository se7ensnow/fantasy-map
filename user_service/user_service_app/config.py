import os
import dotenv

dotenv.load_dotenv()


def _require(name: str) -> str:
    """Return a mandatory setting or stop the service at startup.

    A silent fallback for secrets is dangerous: a forgotten variable would make
    the service sign JWTs with a key that is public in the repository.
    """
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(
            f"Environment variable {name} is required but not set. "
            "Create .envs/*.env with `make env` (see docs/deployment.md)."
        )
    return value


DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = _require("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
