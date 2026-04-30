from main.helper.rich_json_logger import RichJsonLogger

_RICH_JSON_CLASS_MAPPING = {}
logger = RichJsonLogger.logger


def add_class_mappings(class_mappings):
    """
    Adds the given class mappings.

    :param class_mappings: A dictionary of name-to-class mappings.
    """
    if not isinstance(class_mappings, dict):
        return

    for name, class_type in class_mappings.items():
        add_class_mapping(name, class_type)


def add_class_mapping(name, class_type):
    """
    Adds the given class to the mapping table.

    :param name: The string name representing the class.
    :param class_type: The class reference itself.
    :raises ValueError: If the class is already defined.
    """
    if name in _RICH_JSON_CLASS_MAPPING:
        logger.warning(f"RichJSON has the class '{name}' already defined")

    _RICH_JSON_CLASS_MAPPING[name] = class_type


def _map_class_by_name(name):
    """
    Internal function to retrieve a mapped class by its name.

    :param name: The name of the mapped class.
    :return: The class reference.
    :raises ValueError: If the class name could not be found.
    """
    if name not in _RICH_JSON_CLASS_MAPPING:
        raise ValueError(
            f"RichJson could not find the class called '{name}'.\nMake sure it is defined in RichJsonClassMapping.")

    return _RICH_JSON_CLASS_MAPPING[name]
