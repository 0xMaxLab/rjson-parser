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
    _padding = ""

    def __init__(self, label):
        self._label = label
        self._groupLevel = 0
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
            self._groupLevel += 1
            RichJsonLogger._padding += "  "
            self._update_logger_config()

    def _update_logger_config(self):
        logging.basicConfig(
            level=logging.DEBUG,
            stream=sys.stdout,
            format=RichJsonLogger._padding + '[%(levelname)s] %(message)s',
            force=True
        )

    def group_end_all(self):
        if _RICH_JSON_CONFIG["info_enabled"] or _RICH_JSON_CONFIG["debug_enabled"]:
            for i in range(self._groupLevel):
                RichJsonLogger._padding = self._padding[:-2]
            self._groupLevel = 0
            self._update_logger_config()

    def group_end(self):
        if _RICH_JSON_CONFIG["info_enabled"] or _RICH_JSON_CONFIG["debug_enabled"]:
            self._groupLevel -= 1
            RichJsonLogger._padding = self._padding[:-2]
            self._update_logger_config()

    def time_start(self):
        if _RICH_JSON_CONFIG["debug_enabled"]:
            self.start = time.perf_counter_ns()

    def time_end(self):
        if _RICH_JSON_CONFIG["debug_enabled"]:
            self.end = time.perf_counter_ns()
            self.debug(f"{self.end - self.start} ns")