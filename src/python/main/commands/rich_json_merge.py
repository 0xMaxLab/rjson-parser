"""
Joins two structs or arrays together
"""
from .rich_json_ref import _execute_ref_command
from ..core.rich_json import _RICH_JSON_COMMAND_DELIMITER
from ..helper.rich_json_helper import get_field, is_json_object, merge_into_target


def _execute_merge_command(parser, context):
    refs = context.current_member.split(_RICH_JSON_COMMAND_DELIMITER)
    struct_or_array = get_field(parser.cache.stack, context.current_address)
    current_address = context.current_address

    context.current_member = refs[0].strip()
    context.current_member = _execute_ref_command(parser, context)
    context.current_address = current_address

    if is_json_object(context.current_member):
        merge_into_target(struct_or_array, context.current_member)
        for i in range(1, len(refs)):
            context.current_member = refs[i].strip()
            context.current_member = _execute_ref_command(parser, context)
            context.current_address = current_address
            merge_into_target(struct_or_array, context.current_member)
    else:
        struct_or_array = []
        parser.cache.stack[context.current_address] = struct_or_array
        for i in range(0, len(refs)):
            context.current_member = refs[i].strip()
            context.current_member = _execute_ref_command(parser, context)
            context.current_address = current_address
            struct_or_array.extend(context.current_member)

    return struct_or_array
