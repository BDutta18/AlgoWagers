from datetime import datetime, timezone

from config import AUTO_CREATE_MARKETS, SCHEDULER_ENABLED

_scheduler = None


def start_market_scheduler():
    global _scheduler
    if _scheduler is not None or not SCHEDULER_ENABLED:
        return _scheduler

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
    except ModuleNotFoundError:
        return None

    from controllers.market_controller import ensure_daily_markets, resolve_due_markets

    _scheduler = BackgroundScheduler(timezone=timezone.utc)

    if AUTO_CREATE_MARKETS:
        _scheduler.add_job(
            ensure_daily_markets,
            trigger="interval",
            hours=24,
            next_run_time=datetime.now(timezone.utc),
            id="ensure_daily_markets",
            replace_existing=True,
        )

    _scheduler.add_job(
        resolve_due_markets,
        trigger="interval",
        minutes=1,
        next_run_time=datetime.now(timezone.utc),
        id="resolve_due_markets",
        replace_existing=True,
    )

    _scheduler.start()
    return _scheduler
