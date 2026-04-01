from ..core.rich_json import (
    _RICH_JSON_COMMAND_WILDCARD,
    _RICH_JSON_INTERPOLATION_WILDCARD,
    _RICH_JSON_KEY_COMMAND_MEMBER,
    _RICH_JSON_LATE_CONSTRUCTOR_MEMBER,
    get_array_element,
    get_object_field,
    RichJsonParser
)
from .rich_json_helper import get_field_by_key, is_json_object, matches_wildcard

def is_resolved(obj):
    """
    Checks if the given object has unresolved RichJson expressions in it.
    """
    parser = RichJsonParser()
    return _is_resolved_recursive(parser, obj, parser.cache.resolve_address(obj))

def _is_resolved_recursive(parser, obj, address):
    if obj is None:
        return True

    # Check if already processed to avoid infinite loops
    if get_field_by_key(parser.cache.stack, address) is not None:
        return True

    parser.cache.stack[address] = obj

    is_json_obj = is_json_object(obj)

    # Check for unresolved key commands or late constructors
    if is_json_obj and (
            _RICH_JSON_KEY_COMMAND_MEMBER in obj or
            _RICH_JSON_LATE_CONSTRUCTOR_MEMBER in obj
    ):
        return False

    # Determine iteration (dict keys or list indices)
    if is_json_obj:
        names = list(obj.keys())
        get_func = get_object_field
    else:
        names = list(range(len(obj)))
        get_func = get_array_element

    for i, name in enumerate(names):
        actual_name = name if is_json_obj else i
        member = get_func(obj, actual_name, i)

        if not parser._is_member_rich_json_able(member):
            continue

        if isinstance(member, str):
            # Check for command or interpolation wildcards
            if (matches_wildcard(member, _RICH_JSON_COMMAND_WILDCARD) or
                    matches_wildcard(member, _RICH_JSON_INTERPOLATION_WILDCARD)):
                return False

        # Recursive check for objects and lists
        elif not _is_resolved_recursive(parser, member, parser.cache.resolve_address(member)):
            return False

    return True