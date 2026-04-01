"""
References the given member on self
"""
from .rich_json_ref import __execute_ref_command

def _execute_this_command(parser, context):
    return __execute_ref_command(parser, context)