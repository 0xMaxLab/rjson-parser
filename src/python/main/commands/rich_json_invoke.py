"""
Invokes the given member
"""


def _execute_invoke_command(parser, context):
    return context.current_member()
