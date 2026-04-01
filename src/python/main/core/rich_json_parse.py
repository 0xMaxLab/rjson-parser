from .rich_json import RichJsonParser
from ..other.rich_json_configuration import _RICH_JSON_CONFIG

def parse(obj):
    """
    Parses RichJson expressions in a JSON object.

    :param obj: The JSON object (dictionary/list) to parse.
    :return: The parsed object.
    """
    if _RICH_JSON_CONFIG.get("debugEnabled"):
        print("RichJson is going to be applied.")

    parser = RichJsonParser()
    return parser.parse(obj, True)