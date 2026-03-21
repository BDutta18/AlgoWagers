from models.feed_store import feed
from datetime import datetime

def add_event(event):
    """Adds an event to the global feed and broadcasts it via Socket.io."""
    from app import socketio # Lazy import to avoid circular dependency
    
    event["timestamp"] = datetime.utcnow().isoformat()
    feed.insert(0, event) # keep latest at top
    
    # Broadcast to all connected clients for real-time UI updates
    socketio.emit('audit_update', event)

def get_feed():
    """Returns the latest 50 events from the feed."""
    return feed[:50]
