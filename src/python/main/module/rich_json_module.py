import logging
from ..core.rich_json import _RICH_JSON_COMMANDS
from ..core.rich_json_constants import _RICH_JSON_LATE_APPLIES

# Globales Dictionary für registrierte Module
_RICH_JSON_MODULES = {}

class RichJsonModule:
    """
    Use this class in order to write your own RichJson modules.
    """
    def __init__(self, name):
        self.name = name
        self.late_applies = []
        self.commands = {}
        self.kcmd_ignores = {}
        self.is_included = False

    def add_late_apply(self, name, func, ignores=None):
        """
        Registers a command that is flagged for late application.
        This adds the command name to the late application queue and defines its
        execution logic and ignore rules.

        :param name: The unique identifier for the command.
        :param func: The function or logic to be executed when the command is called.
        :param ignores: An optional list of identifiers or contexts that this command should ignore.
        :return: The current instance for method chaining.
        """
        self.late_applies.append(name)
        if isinstance(ignores, list):
            self.kcmd_ignores[name] = ignores

        return self.add_command(name, func)

    def add_command(self, name, func, ignores=None):
        """
        Adds a standard command to the command registry.
        Mapping the command name to its respective function and optionally
        setting up ignore rules.

        :param name: The unique identifier for the command.
        :param func: The function or logic to be executed when the command is called.
        :param ignores: An optional list of identifiers or contexts that this command should ignore.
        :return: The current instance for method chaining.
        """
        self.commands[name] = func
        if isinstance(ignores, list):
            self.kcmd_ignores[name] = ignores

        return self

    def _include(self):
        """
        Internal method to include the module's commands into the global registry.
        """
        self.is_included = True

        for name, func in self.commands.items():
            if name in _RICH_JSON_COMMANDS.built_in:
                raise ValueError(f"RichJson: You cannot override built-in commands. Affected command is '#{name}'")

            _RICH_JSON_COMMANDS.available[name] = func
            _RICH_JSON_COMMANDS.enabled[name] = func

        for name in self.late_applies:
            if name not in _RICH_JSON_LATE_APPLIES:
                _RICH_JSON_LATE_APPLIES.append(name)

        for name, ignored in self.kcmd_ignores.items():
            _RICH_JSON_COMMANDS.kcmd_ignored[name] = ignored

    def _exclude(self):
        """
        Internal method to remove the module's commands from the global registry.
        """
        self.is_included = False

        for name in self.late_applies:
            if name in _RICH_JSON_LATE_APPLIES:
                _RICH_JSON_LATE_APPLIES.remove(name)

        for name in self.commands.keys():
            _RICH_JSON_COMMANDS.available.pop(name, None)
            _RICH_JSON_COMMANDS.enabled.pop(name, None)


def register_module(module):
    """
    Registers a RichJson module.
    """
    logging.info(f"RichJson registering module '{module.name}'")
    _RICH_JSON_MODULES[module.name] = module
    return module


def unregister_module(name):
    """
    Unregister a RichJson module.
    """
    if is_module_registered(name):
        module = _RICH_JSON_MODULES[name]
        if module.is_included:
            raise RuntimeError(f"RichJson: Cannot unregister module '{name}' because it is currently included")

        logging.info(f"RichJson unregistering module '{name}'")
        del _RICH_JSON_MODULES[name]


def is_module_registered(name):
    """
    Checks if a RichJson module is registered.
    """
    return name in _RICH_JSON_MODULES


def include_module(name):
    """
    Includes a RichJson module.
    """
    if is_module_registered(name):
        module = _RICH_JSON_MODULES[name]
        if not module.is_included:
            logging.info(f"RichJson including module '{name}'")
            module._include()


def exclude_module(name):
    """
    Excludes a RichJson module.
    """
    if is_module_registered(name):
        module = _RICH_JSON_MODULES[name]
        if module.is_included:
            logging.info(f"RichJson excluding module '{name}'")
            module._exclude()