"""
Reads the given json file
"""
from ..helper.rich_json_file_helper import read_file
from ..helper.rich_json_helper import concat_strings


def _execute_file_command(parser, context):
    return read_file(concat_strings(context.current_member, ".json"), True)
