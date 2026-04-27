_RICH_JSON_ENVIRONMENT = {}


def add_environment_variables(envs):
    """
    Adds multiple constants to the environment.

    :param envs: A dictionary of environment variables to add.
    """
    if not isinstance(envs, dict):
        return

    for name, value in envs.items():
        add_environment_variable(name, value)


def add_environment_variable(name, value):
    """
    Adds a single constant to the environment.

    :param name: The name of the environment variable.
    :param value: The value to bind to the environment variable.
    :raises ValueError: If the env variable is already defined.
    """
    if name in _RICH_JSON_ENVIRONMENT:
        raise ValueError(f"RichJson has the env variable '{name}' already defined")

    _RICH_JSON_ENVIRONMENT[name] = value
