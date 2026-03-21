from models.feed_store import feed
from datetime import datetime

def add_event(event):
    event["timestamp"] = datetime.utcnow().isoformat()
    feed.insert(0, event)  # latest first

def get_feed():
    return feed[:50]  # limit