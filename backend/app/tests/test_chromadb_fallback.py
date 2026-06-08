import pytest
import importlib
from unittest.mock import patch, MagicMock
import app.memory.chromadb_client

def test_chromadb_cloud_client_success():
    # If CHROMA_API_KEY is configured with a valid key, CloudClient should succeed
    with patch("chromadb.CloudClient") as mock_cloud, \
         patch("chromadb.PersistentClient") as mock_persistent, \
         patch("chromadb.EphemeralClient") as mock_ephemeral, \
         patch("app.config.settings.settings.CHROMA_API_KEY", "valid-prod-key-123"):
        
        importlib.reload(app.memory.chromadb_client)
        
        mock_cloud.assert_called_once()
        mock_persistent.assert_not_called()
        mock_ephemeral.assert_not_called()

def test_chromadb_fallback_to_persistent():
    # If CHROMA_API_KEY is "dummy" or empty, CloudClient should not be called,
    # and it should fall back to PersistentClient.
    with patch("chromadb.CloudClient") as mock_cloud, \
         patch("chromadb.PersistentClient") as mock_persistent, \
         patch("chromadb.EphemeralClient") as mock_ephemeral, \
         patch("app.config.settings.settings.CHROMA_API_KEY", "dummy"):
        
        importlib.reload(app.memory.chromadb_client)
        
        mock_cloud.assert_not_called()
        mock_persistent.assert_called_once()
        mock_ephemeral.assert_not_called()

def test_chromadb_fallback_to_ephemeral():
    # If both CloudClient and PersistentClient fail, it should fall back to EphemeralClient
    with patch("chromadb.CloudClient") as mock_cloud, \
         patch("chromadb.PersistentClient", side_effect=Exception("Disk/Permission Error")) as mock_persistent, \
         patch("chromadb.EphemeralClient") as mock_ephemeral, \
         patch("app.config.settings.settings.CHROMA_API_KEY", "dummy"):
        
        importlib.reload(app.memory.chromadb_client)
        
        mock_cloud.assert_not_called()
        mock_persistent.assert_called_once()
        mock_ephemeral.assert_called_once()
