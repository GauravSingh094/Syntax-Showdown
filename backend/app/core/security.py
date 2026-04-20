from fastapi import HTTPException

BLOCKED_PHRASES = ["ignore", "override", "system", "act as"]
MAX_TOPIC_LENGTH = 250

def validate_topic(topic: str) -> str:
    topic = topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    if len(topic) > MAX_TOPIC_LENGTH:
        raise HTTPException(status_code=400, detail=f"Topic exceeds {MAX_TOPIC_LENGTH} characters")
    lower = topic.lower()
    for phrase in BLOCKED_PHRASES:
        if phrase in lower:
            raise HTTPException(status_code=400, detail="Topic contains disallowed content")
    return topic
