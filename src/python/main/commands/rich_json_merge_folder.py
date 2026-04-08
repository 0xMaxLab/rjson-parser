"""
Merges the given folder in one object
"""
from .rich_json_folder import _execute_folder_command
from ..helper.rich_json_helper import get_keys_sorted, merge_into_target


def _execute_merge_folder_command(parser, context):
    folder = _execute_folder_command(parser, context)
    entry_names = get_keys_sorted(folder)
    rv = {}

    if len(entry_names) != 0:
        for name in entry_names:
            merge_into_target(rv, folder[name])

    return rv
