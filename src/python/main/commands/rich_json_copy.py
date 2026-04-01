"""
Makes a deep copy of the given struct or array
"""
from ..helper.rich_json_helper import clone_object
from .rich_json_ref import _execute_ref_command

def _execute_copy_command(parser, context):
    return clone_object(_execute_ref_command(parser, context))