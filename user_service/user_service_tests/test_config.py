import importlib

import pytest

from user_service_app import config


@pytest.fixture
def reload_config(monkeypatch):
    # Do not let a developer's local .env leak into these tests.
    monkeypatch.setattr("dotenv.load_dotenv", lambda *args, **kwargs: False)
    yield lambda: importlib.reload(config)
    monkeypatch.undo()
    importlib.reload(config)


@pytest.mark.parametrize("value", [None, "", "   "])
def test_missing_secret_key_stops_startup(monkeypatch, reload_config, value):
    if value is None:
        monkeypatch.delenv("SECRET_KEY", raising=False)
    else:
        monkeypatch.setenv("SECRET_KEY", value)

    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        reload_config()


def test_secret_key_is_read_from_environment(monkeypatch, reload_config):
    monkeypatch.setenv("SECRET_KEY", "another-key")

    assert reload_config().SECRET_KEY == "another-key"
