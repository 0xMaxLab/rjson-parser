from .rich_json_helper import clone_object
from ..core.rich_json import _RICH_JSON_KEY_COMMAND_MEMBER


def keep_key_commands(json_object):
    """
    Make key commands constant for the given JSON object by creating a deep copy
    of the key command member.
    """
    if isinstance(json_object, dict) and _RICH_JSON_KEY_COMMAND_MEMBER in json_object:
        json_object[_RICH_JSON_KEY_COMMAND_MEMBER] = clone_object(json_object[_RICH_JSON_KEY_COMMAND_MEMBER])

    return json_object
