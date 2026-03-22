from datetime import datetime, timezone

from models.feed_store import feed


def add_event(event):
    event["timestamp"] = datetime.now(timezone.utc).isoformat()
    feed.insert(0, event)


def get_feed(limit=50, event_type=None, actor_type=None):
    events = feed

    if event_type:
        events = [event for event in events if event.get("type") == event_type]

    if actor_type:
        events = [event for event in events if event.get("actor_type") == actor_type]

    return events[:limit]
