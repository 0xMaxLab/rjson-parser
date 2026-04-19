import sys
import time
import logging
from ..other.rich_json_configuration import _RICH_JSON_CONFIG

logging.basicConfig(
    level=logging.DEBUG,
    stream=sys.stdout,
    format='[%(levelname)s] %(message)s',
    force=True
)

class RichJsonLogger:
    logger = logging.getLogger("RichJSON")

    def __init__(self, label):
        self._label = label
        self._padding = ""
        self.start = None
        self.end = None

    def info(self, message):
        if _RICH_JSON_CONFIG["info_enabled"]:
            RichJsonLogger.logger.info(self._build_message(message))

    def _build_message(self, message):
        message = self._label + " " + message
        return message

    def debug(self, message):
        if _RICH_JSON_CONFIG["debug_enabled"]:
            RichJsonLogger.logger.debug(self._build_message(message))

    def error(self, message):
        RichJsonLogger.logger.error(self._build_message(message))

    def group_start(self):
        if _RICH_JSON_CONFIG["info_enabled"] or _RICH_JSON_CONFIG["debug_enabled"]:
            self._padding += "  "
            logging.basicConfig(
                level=logging.DEBUG,
                stream=sys.stdout,
                format=self._padding + '[%(levelname)s] %(message)s',
                force=True
            )

    def group_end(self):
        if _RICH_JSON_CONFIG["info_enabled"] or _RICH_JSON_CONFIG["debug_enabled"]:
            self._padding = self._padding[:-2]
            logging.basicConfig(
                level=logging.DEBUG,
                stream=sys.stdout,
                format=self._padding + '[%(levelname)s] %(message)s',
                force=True
            )

    def group_end_all(self):
        if _RICH_JSON_CONFIG["info_enabled"] or _RICH_JSON_CONFIG["debug_enabled"]:
            logging.basicConfig(
                level=logging.DEBUG,
                stream=sys.stdout,
                format='[%(levelname)s] %(message)s',
                force=True
            )

    def time_start(self):
        if _RICH_JSON_CONFIG["debug_enabled"]:
            self.start = time.perf_counter_ns()

    def time_end(self):
        if _RICH_JSON_CONFIG["debug_enabled"]:
            self.end = time.perf_counter_ns()
            self.debug(f"{self.end - self.start} ns")