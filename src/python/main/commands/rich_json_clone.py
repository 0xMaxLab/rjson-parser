"""
Makes a deep copy of the given struct
"""
import logging
from ..helper.rich_json_helper import clone_object
from ..other.rich_json_configuration import _RICH_JSON_CONFIG

def _execute_clone_command(parser, context):
    if parser._is_clone_applying():
        if _RICH_JSON_CONFIG["crash_on_nested_clone_enabled"]:
            raise ValueError(f"RichJson nested clone detected in '{context.current_address}'.")
        return context.current_member

    parser.cache.clone_address = context.current_address
    context.current_member = clone_object(context.current_member)

    if _RICH_JSON_CONFIG["debug_enabled"]:
        logging.debug(f"RichJson resolved clone in '{parser.cache.clone_address}'.")

    return context.current_member