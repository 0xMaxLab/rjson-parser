from ..helper.rich_json_helper import merge_into_target

_RICH_JSON_CONFIG = {
    "log_enabled": True,
    "debug_enabled": False,
    "string_interpolations_enabled": True,
    "file_cache_enabled": True,
    "late_constructor_enabled": True,
    "crash_on_nested_clone_enabled": False,
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
        "logging_enabled": True,
        "debug_enabled": False,
        "string_interpolations_enabled": True,
        "file_cache_enabled": True,
        "late_constructor_enabled": True,
        "crash_on_nested_clone_enabled": False,
    }

    _RICH_JSON_CONFIG = merge_into_target(default_config, config)
