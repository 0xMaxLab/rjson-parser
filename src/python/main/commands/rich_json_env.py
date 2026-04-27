"""
References the given env variable
"""
from .rich_json_ref import _execute_ref_command
from ..core.rich_json_constants import _RICH_JSON_COMMAND_PATH_DELIMITER
from ..helper.rich_json_helper import is_json_object
from ..other.rich_json_environment import _RICH_JSON_ENVIRONMENT, add_environment_variables


def _execute_env_command(parser, context):
    if is_json_object(context.current_member):
        add_environment_variables(context.current_member)
        return context.current_member

    ref = context.current_member.split(_RICH_JSON_COMMAND_PATH_DELIMITER, 1)
    first_ref = ref[0]

    if first_ref in _RICH_JSON_ENVIRONMENT:
        context.current_member = _RICH_JSON_ENVIRONMENT[first_ref]
        context.root = context.current_member if is_json_object(context.current_member) else {}
        context.current_address = parser.cache.resolve_address(context.root)

        context.current_member = parser._parse_rich_json_in_member()
        _RICH_JSON_ENVIRONMENT[first_ref] = context.current_member

        if len(ref) == 2:
            context.current_member = ref[1]
            context.current_member = _execute_ref_command(parser, context)

        return context.current_member
    else:
        raise ValueError(f"Environment variable or path '{context.current_member}' does not exist.")
