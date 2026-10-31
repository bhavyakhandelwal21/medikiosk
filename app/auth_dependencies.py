import base64
import hashlib
import hmac
import json
import os
import time
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DBUser

bearer_scheme = HTTPBearer(auto_error=False)


def _secret() -> bytes:
    return os.getenv("AUTH_SECRET", "development-secret-change-me").encode("utf-8")


def create_access_token(user: DBUser, expires_in: int = 60 * 60 * 24 * 7) -> str:
    payload = {"sub": user.id, "exp": int(time.time()) + expires_in}
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(_secret(), encoded_payload.encode(), hashlib.sha256).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{encoded_payload}.{encoded_signature}"


def _decode_access_token(token: str) -> int:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        expected_signature = hmac.new(_secret(), encoded_payload.encode(), hashlib.sha256).digest()
        actual_signature = base64.urlsafe_b64decode(encoded_signature + "=" * (-len(encoded_signature) % 4))
        if not hmac.compare_digest(actual_signature, expected_signature):
            raise ValueError("Invalid signature")
        payload = json.loads(base64.urlsafe_b64decode(encoded_payload + "=" * (-len(encoded_payload) % 4)))
        user_id = int(payload["sub"])
        if int(payload["exp"]) <= int(time.time()):
            raise ValueError("Expired token")
        return user_id
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Session = Depends(get_db),
) -> DBUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = db.query(DBUser).filter(DBUser.id == _decode_access_token(credentials.credentials)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account no longer exists")
    return user


def require_creator(current_user: DBUser = Depends(get_current_user)) -> DBUser:
    if current_user.role != "creator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creator access required")
    return current_user
