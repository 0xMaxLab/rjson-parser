import json
import os

from .rich_json_helper import concat_strings, merge_into_target
from ..core.rich_json import set_command_enabled, parse_rich_json
from ..core.rich_json_constants import _RICH_JSON_LATE_APPLIES
from ..other.rich_json_configuration import _RICH_JSON_CONFIG

FILE_CACHE = {}


def read_directory(path, _execute_late_applies=False):
    """
    Reads a directory like a JSON file and resolves RichJson.

    :param path: The path to the directory.
    :param _execute_late_applies: Whether to execute late applies (default: False).
    :return: A dictionary containing the resolved JSON data.
    """
    rv = {}

    if not _execute_late_applies:
        for cmd in _RICH_JSON_LATE_APPLIES:
            set_command_enabled(cmd, False)

    with os.scandir(path) as entries:
        for entry in entries:
            if entry.is_file():
                name_without_extension = os.path.splitext(entry.name)[0]
                rv[name_without_extension] = read_file(concat_strings(path, "/", entry.name), True)
            elif entry.is_dir():
                rv[entry.name] = read_directory(concat_strings(path, "/", entry.name), True)

    if not _execute_late_applies:
        for cmd in _RICH_JSON_LATE_APPLIES:
            set_command_enabled(cmd, True)

    return rv


def read_file(path, _execute_late_applies=False):
    """
    Reads a JSON file and resolves RichJson if contained.

    :param path: The path to the file.
    :param _execute_late_applies: Whether to execute late applies (default: False).
    :return: The parsed JSON data (dict or list).
    """
    if _RICH_JSON_CONFIG.get('file_cache_enabled') and path in FILE_CACHE:
        return FILE_CACHE[path]

    if _RICH_JSON_CONFIG.get('file_cache_enabled'):
        FILE_CACHE[path] = {}

    if not _execute_late_applies:
        for cmd in _RICH_JSON_LATE_APPLIES:
            set_command_enabled(cmd, False)

    with open(path, 'r', encoding='utf-8') as f:
        rv = json.load(f)

    rv = parse_rich_json(rv)

    if not _execute_late_applies:
        for cmd in _RICH_JSON_LATE_APPLIES:
            set_command_enabled(cmd, True)

    if _RICH_JSON_CONFIG.get('file_cache_enabled'):
        FILE_CACHE[path] = merge_into_target(FILE_CACHE[path], rv)

    return rv
