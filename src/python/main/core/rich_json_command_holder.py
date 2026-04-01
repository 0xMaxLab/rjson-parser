from ..helper.rich_json_helper import merge_into_without_rebind
from ..other.rich_json_configuration import _RICH_JSON_CONFIG

class RichJsonCommandHolder:
    """
    Holds and manages the available, enabled, and built-in RichJson commands.
    """
    def __init__(self):
        from ..commands.rich_json_ref import _execute_ref_command
        from ..commands.rich_json_env import _execute_env_command
        from ..commands.rich_json_file import _execute_file_command
        from ..commands.rich_json_folder import _execute_folder_command
        from ..commands.rich_json_merge import _execute_merge_command
        from ..commands.rich_json_merge_folder import _execute_merge_folder_command
        from ..commands.rich_json_copy import _execute_copy_command
        from ..commands.rich_json_clone import _execute_clone_command
        from ..commands.rich_json_this import _execute_this_command
        from ..commands.rich_json_invoke import _execute_invoke_command

        self.void_command = lambda *args, **kwargs: None

        self.available = {
            "ref": _execute_ref_command,
            "env": _execute_env_command,
            "this": _execute_this_command,
            "merge": _execute_merge_command,
            "copy": _execute_copy_command,
            "clone": _execute_clone_command,
            "invoke": _execute_invoke_command,
            "file": _execute_file_command,
            "folder": _execute_folder_command,
            "merge_folder": _execute_merge_folder_command,
        }

        self.enabled = {}
        self.built_in = {}
        self.kcmd_ignored = {}

        merge_into_without_rebind(self.enabled, self.available)
        merge_into_without_rebind(self.built_in, self.available)

_RICH_JSON_COMMANDS = RichJsonCommandHolder()
_RICH_JSON_LATE_APPLIES = ["this", "clone", "invoke"]

def set_command_enabled(command, enabled):
    """
    Toggles a RichJson command's enabled state.

    :param command: Name of the command to toggle.
    :param enabled: Whether to enable or disable the command.
    :raises Exception: If the command is not in the available registry.
    """
    if command not in _RICH_JSON_COMMANDS.available:
        _throw_command_not_found(command)

    if enabled:
        _RICH_JSON_COMMANDS.enabled[command] = _RICH_JSON_COMMANDS.available[command]
    else:
        _RICH_JSON_COMMANDS.enabled[command] = _RICH_JSON_COMMANDS.void_command

    if _RICH_JSON_CONFIG.get("debugEnabled"):
        state = "enabled" if enabled else "disabled"
        print(f"RichJson command '{command}' was {state}.")

def _throw_command_not_found(command):
    raise Exception(f"RichJson Command '{command}' not found")