import re
import types

from ..core.rich_json_cache import RichJsonCache


def has_field(obj, key):
    """Safely checks if a key (in a dict) or an attribute (in an instance) exists."""
    if isinstance(obj, dict):
        return key in obj
    return hasattr(obj, key)


def get_field(obj, key, default=None):
    """Safely retrieves a value from a dict or an instance attribute."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def set_field(obj, key, value):
    """Safely sets a value in a dict or as an attribute on an instance."""
    if isinstance(obj, dict):
        obj[key] = value
    else:
        setattr(obj, key, value)


def delete_field(obj, key):
    """Safely removes a key from a dict or an attribute from an instance if it exists."""
    if isinstance(obj, dict):
        if key in obj:
            del obj[key]
    else:
        if hasattr(obj, key):
            delattr(obj, key)


def merge_objects(*objects):
    return merge_into_target({}, *objects)


def merge_into_target(target, *others):
    for other in others:
        if other is None:
            continue
        cache = RichJsonCache()
        _merge_into_target(cache, target, other)
        if cache.level != 0:
            print("Error: RichJson merge_into_target failed!")
    return target


def _merge_into_target(cache, target, other, force=False):
    if not is_json_object(other):
        return target

    cache.stack[cache.resolve_address(other)] = other
    cache.level += 1

    is_other_dict = isinstance(other, dict)
    names = list(other.keys()) if is_other_dict else list(other.__dict__.keys())

    for name in names:
        member = get_field(other, name)

        if callable(member):
            if not has_field(target, name):
                set_field(target, name, types.MethodType(member, target))
            elif force:
                set_field(target, name, types.MethodType(member, target))
        else:
            target_member = get_field(target, name)

            if member is not None and is_json_object(member) and is_json_object(target_member):
                if cache.resolve_address(member) not in cache.stack:
                    _merge_into_target(cache, target_member, member)
            elif not has_field(target, name):
                set_field(target, name, member)
            elif force:
                set_field(target, name, member)

    cache.level -= 1
    return target


def merge_objects_without_rebind(*objects):
    return merge_into_without_rebind({}, *objects)


def merge_into_without_rebind(target, *others):
    for other in others:
        if other is None:
            continue
        cache = RichJsonCache()
        _merge_into_without_rebind(cache, target, other)
        if cache.level != 0:
            print("Error: RichJson merge_into_without_rebind failed!")
    return target


def _merge_into_without_rebind(cache, target, other, force=False):
    if not is_json_object(other):
        return target

    cache.stack[cache.resolve_address(other)] = other
    cache.level += 1

    is_other_dict = isinstance(other, dict)
    names = list(other.keys()) if is_other_dict else list(other.__dict__.keys())

    for name in names:
        member = get_field(other, name)

        if callable(member):
            if not has_field(target, name):
                set_field(target, name, member)
            elif force:
                set_field(target, name, member)
        else:
            target_member = get_field(target, name)

            if member is not None and is_json_object(member) and is_json_object(target_member):
                if cache.resolve_address(member) not in cache.stack:
                    _merge_into_without_rebind(cache, target_member, member)
            elif not has_field(target, name):
                set_field(target, name, member)
            elif force:
                set_field(target, name, member)

    cache.level -= 1
    return target


def clone_object(object_to_clone):
    cache = RichJsonCache()
    cache.str = is_json_object(object_to_clone)
    cache.rv = {} if is_json_object(object_to_clone) else []
    cache.next = cache.rv
    cache.stack[cache.resolve_address(object_to_clone)] = cache.rv

    cloned = _clone_object(cache, object_to_clone)
    if cache.level != 0:
        print("Error: RichJson clone_object failed!")
    return cloned


def _clone_object(cache, obj):
    if obj is None or (not is_json_object(obj) and not isinstance(obj, list)):
        return obj

    target = cache.next
    cache.level += 1

    if is_json_object(obj):
        is_obj_dict = isinstance(obj, dict)
        names = list(obj.keys()) if is_obj_dict else list(obj.__dict__.keys())

        for name in names:
            member = get_field(obj, name)

            if callable(member):
                set_field(target, name, types.MethodType(member, target))
            elif is_json_object(member) or isinstance(member, list):
                addr = cache.resolve_address(member)
                existing_clone = cache.stack.get(addr)

                if existing_clone is None:
                    new_obj = {} if is_json_object(member) else []
                    cache.str = is_json_object(member)
                    cache.stack[addr] = new_obj
                    cache.next = new_obj
                    set_field(target, name, _clone_object(cache, member))
                else:
                    set_field(target, name, existing_clone)
            else:
                set_field(target, name, member)
    else:
        for member in obj:
            if is_json_object(member) or isinstance(member, list):
                addr = cache.resolve_address(member)
                existing_clone = cache.stack.get(addr)

                if existing_clone is None:
                    new_obj = {} if is_json_object(member) else []
                    cache.str = is_json_object(member)
                    cache.stack[addr] = new_obj
                    cache.next = new_obj
                    target.append(_clone_object(cache, member))
                else:
                    target.append(existing_clone)
            else:
                target.append(member)

    cache.level -= 1
    return target


def is_json_object(obj):
    if obj is None or isinstance(obj, (str, int, float, bool, list, tuple, set)):
        return False
    return isinstance(obj, dict) or hasattr(obj, "__dict__")


def get_keys_sorted(obj):
    if isinstance(obj, dict):
        keys = list(obj.keys())
    elif hasattr(obj, "__dict__"):
        keys = list(obj.__dict__.keys())
    else:
        return []
    keys.sort(key=str.lower)
    return keys


def concat_strings(*strings):
    """
    Concat redundancy strings.

    :param strings: Variable length string arguments.
    :return: The concatenated string.
    """
    return "".join(strings)


def concat_arrays(*arrays):
    """
    Concat redundancy arrays.

    :param arrays: Variable length array arguments.
    :return: A list containing all the arrays.
    """
    rv = []
    for array in arrays:
        rv.append(array)
    return rv


def matches_wildcard(string, wildcard):
    """
    Checks if the given string matches the wildcard.

    :param string: The string to test.
    :param wildcard: The wildcard pattern.
    :return: True if it matches, False otherwise.
    """
    if not isinstance(string, str):
        return False

    # Escape regex specials and convert wildcard * to regex .*
    escaped = re.escape(wildcard)
    regex_str = "^" + escaped.replace(r"\*", ".*") + "$"

    return bool(re.match(regex_str, string))
