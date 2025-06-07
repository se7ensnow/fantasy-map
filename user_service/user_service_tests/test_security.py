from user_service_app import security

from datetime import timedelta
from uuid import UUID

def test_verify_jwt_token():
    user_id = UUID("11111111-1111-1111-1111-111111111111")
    token = security.create_access_token(
        data={"sub": str(user_id)},
        expires_delta=timedelta(minutes=5)
    )

    decoded_id = security.verify_jwt_token(token)
    assert decoded_id == user_id

def test_verify_invalid_token():
    invalid_token = "invalid.token.expired"
    result = security.verify_jwt_token(invalid_token)
    assert result is None