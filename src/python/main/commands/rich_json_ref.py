"""
References the given member's value (any)
"""
from ..helper.rich_json_helper import concat_strings, is_json_object
from ..core.rich_json_constants import _RICH_JSON_COMMAND_PATH_DELIMITER

def _execute_ref_command(parser, context):
    if context.current_member == "":
        return context.root

    prev_member = context.root
    current_address = context.current_address
    refs = context.current_member.split(_RICH_JSON_COMMAND_PATH_DELIMITER)

    for ref in refs:
        if is_json_object(prev_member):
            if ref in prev_member:
                context.current_member = prev_member[ref]
            else:
                raise ValueError(f"Member '{ref}' in '{parser.cache.resolve_address(prev_member)}' does not exist")

        if is_json_object(context.current_member) or isinstance(context.current_member, list):
            context.current_address = parser.cache.resolve_address(context.current_member)
        else:
            context.current_address = concat_strings(parser.cache.resolve_address(prev_member), "_", ref)

        context.current_member = parser._parse_rich_json_in_member(context)
        prev_member = context.current_member

    context.current_address = current_address
    return context.current_member