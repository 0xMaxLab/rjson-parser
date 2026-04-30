from ..helper.rich_json_helper import merge_into_target

_RICH_JSON_CONFIG = {
    "infoEnabled": True,
    "debugEnabled": False,
    "stringInterpolationsEnabled": True,
    "fileCacheEnabled": True,
    "lateConstructorEnabled": True,
    "crashOnNestedCloneEnabled": True,
}


def update_configuration(config):
    """
    Updates the global configuration for the library.

    :param config: The configuration dictionary.
                   - debugEnabled (bool): When true, enables rich JSON logging for debugging purposes.
                   - fileCacheEnabled (bool): Toggles the internal file system caching mechanism.
                   - lateConstructorEnabled (bool): Enables delayed object construction to improve initial load performance.
                   - crashOnNestedCloneEnabled (bool): If true, the library will throw an error when attempting to clone inside a clone structure.
    """
    global _RICH_JSON_CONFIG

    if not config or not isinstance(config, dict):
        return

    default_config = {
        "infoEnabled": True,
        "debugEnabled": False,
        "stringInterpolationsEnabled": True,
        "fileCacheEnabled": True,
        "lateConstructorEnabled": True,
        "crashOnNestedCloneEnabled": True,
    }

    _RICH_JSON_CONFIG = merge_into_target(config, default_config)
