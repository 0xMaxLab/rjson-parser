from .rich_json import RichJsonParser


def parse_rich_json(obj):
    """
    Parses RichJson expressions in a JSON object.

    :param obj: The JSON object (dictionary/list) to parse.
    :return: The parsed object.
    """
    print("RichJson is going to be applied...")

    return RichJsonParser().parse(obj, True)
