import logging, json, sys
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "event": record.getMessage(),
            "logger": record.name,
        }
        for key in ("request_id", "user_id", "event_type"):
            if hasattr(record, key):
                log[key] = getattr(record, key)
        return json.dumps(log)

def configure_logging():
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logging.root.setLevel(logging.INFO)
    logging.root.handlers = [handler]
