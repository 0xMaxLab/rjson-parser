"""
Makes a deep copy of the given struct
"""
import logging

from ..helper.rich_json_helper import clone_object
from ..other.rich_json_configuration import _RICH_JSON_CONFIG
from ..core.rich_json_constants import _RICH_JSON_COMMAND_PATH_DELIMITER


def _execute_clone_command(parser, context):
    if parser._is_clone_applying():
        if _RICH_JSON_CONFIG["crashOnNestedCloneEnabled"]:
            raise ValueError(f"RichJson nested clone detected at '{_RICH_JSON_COMMAND_PATH_DELIMITER.join(map(str, context.current_path))}'.")
        return context.current_member

    parser.cache.clone_address = context.current_address
    context.current_member = clone_object(context.current_member)

    parser.logger.debug(f"RichJson resolved clone at '{_RICH_JSON_COMMAND_PATH_DELIMITER.join(map(str, context.current_path))}'.")

    return context.current_member