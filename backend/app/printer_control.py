from __future__ import annotations

import itertools
import json
import logging
import threading
from typing import TYPE_CHECKING

import paho.mqtt.client as mqtt

from .events import Event

if TYPE_CHECKING:
    from .api import AppState

log = logging.getLogger(__name__)

VALID_ACTIONS = ("pause", "resume", "stop")


class PrinterControl:
    def __init__(self, client: mqtt.Client, serial: str, app_state: "AppState") -> None:
        self._client = client
        self._app_state = app_state
        self._topic = f"device/{serial}/request"
        self._seq = itertools.count(1)
        self._lock = threading.Lock()

    def is_connected(self) -> bool:
        try:
            return bool(self._client.is_connected())
        except Exception:
            return False

    def publish_command(self, action: str, *, source: str = "api") -> tuple[bool, str]:
        if action not in VALID_ACTIONS:
            raise ValueError(f"invalid action: {action}")
        with self._lock:
            seq = str(next(self._seq))
        payload = {"print": {"sequence_id": seq, "command": action}}
        info = self._client.publish(self._topic, json.dumps(payload), qos=0)
        ok = info.rc == mqtt.MQTT_ERR_SUCCESS
        log.info("control %s seq=%s source=%s ok=%s", action, seq, source, ok)
        self._app_state.push_event(
            Event(
                kind=f"control_{action}",
                title=f"Print {action}" + (" (auto)" if source == "auto_pause" else ""),
                detail=f"source={source} seq={seq} ok={ok}",
            )
        )
        return ok, seq
