"""
Reads the data tree of the given folder path
"""
from ..helper.rich_json_file_helper import read_directory

def _execute_folder_command(parser, context):
    return read_directory(context.current_member, True)