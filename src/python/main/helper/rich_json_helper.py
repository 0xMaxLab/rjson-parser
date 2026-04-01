import types
import re
from ..other.rich_json_class_mapping import _RICH_JSON_CLASS_MAPPING
from ..core.rich_json_cache import RichJsonCache

def merge_objects(*objects):
    """
    Merges two or more objects together into a new object.

    :param objects: Objects going to be merged.
    :return: The merged object.
    """
    return merge_into_target({}, *objects)

def merge_into_target(target, *others):
    """
    Merges objects into the target object.

    :param target: The base object.
    :param others: Objects going to be merged into the target.
    :return: The merged target object.
    """
    for other in others:
        if other is None:
            continue

        cache = RichJsonCache()
        _merge_into_target(cache, target, other)

        if cache.level != 0:
            print("Error: RichJson merge_into_target failed!")

    return target

def _merge_into_target(cache, target, other, force=False):
    cache.stack[cache.resolve_address(other)] = other
    cache.level += 1

    # In Python, we generally deal with dictionaries for JSON objects
    # If custom classes are passed, we check __dict__
    is_other_dict = isinstance(other, dict)
    names = list(other.keys()) if is_other_dict else list(other.__dict__.keys())

    for name in names:
        member = other[name] if is_other_dict else getattr(other, name)

        if callable(member):
            if not force and name not in target:
                # Bind the function to the target
                target[name] = types.MethodType(member, target)
        else:
            target_member = target.get(name) if isinstance(target, dict) else getattr(target, name, None)

            if member is not None and is_json_object(member) and is_json_object(target_member):
                if cache.resolve_address(member) not in cache.stack:
                    if isinstance(target, dict):
                        _merge_into_target(cache, target[name], member)
                    else:
                        _merge_into_target(cache, getattr(target, name), member)
            elif not force and name not in (target if isinstance(target, dict) else target.__dict__):
                if isinstance(target, dict):
                    target[name] = member
                else:
                    setattr(target, name, member)

    cache.level -= 1
    return target

def merge_objects_without_rebind(*objects):
    """
    Merges two or more objects together into a new object, without rebinding functions.

    :param objects: Objects going to be merged.
    :return: The merged object.
    """
    return merge_into_without_rebind({}, *objects)

def merge_into_without_rebind(target, *others):
    """
    Merges objects into the target object, without rebinding functions.

    :param target: The base object.
    :param others: Objects going to be merged into the target.
    :return: The merged target object.
    """
    for other in others:
        if other is None:
            continue

        cache = RichJsonCache()
        _merge_into_without_rebind(cache, target, other)

        if cache.level != 0:
            print("Error: RichJson merge_into_without_rebind failed!")

    return target

def _merge_into_without_rebind(cache, target, other, force=False):
    cache.stack[cache.resolve_address(other)] = other
    cache.level += 1

    is_other_dict = isinstance(other, dict)
    names = list(other.keys()) if is_other_dict else list(other.__dict__.keys())

    for name in names:
        member = other[name] if is_other_dict else getattr(other, name)

        if callable(member):
            if not force and name not in target:
                if isinstance(target, dict):
                    target[name] = member
                else:
                    setattr(target, name, member)
        else:
            target_member = target.get(name) if isinstance(target, dict) else getattr(target, name, None)

            if member is not None and is_json_object(member) and is_json_object(target_member):
                if cache.resolve_address(member) not in cache.stack:
                    if isinstance(target, dict):
                        _merge_into_without_rebind(cache, target[name], member)
                    else:
                        _merge_into_without_rebind(cache, getattr(target, name), member)
            else:
                if not force and name not in (target if isinstance(target, dict) else target.__dict__):
                    if isinstance(target, dict):
                        target[name] = member
                    else:
                        setattr(target, name, member)

    cache.level -= 1
    return target

def clone_object(object_to_clone):
    """
    Clones an object or array. Circular dependencies are correctly resolved and functions are rebound.

    :param object_to_clone: The object to clone.
    :return: The clone.
    """
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
            member = obj[name] if is_obj_dict else getattr(obj, name)

            if callable(member):
                target[name] = types.MethodType(member, target)
            elif is_json_object(member) or isinstance(member, list):
                if get_field_by_key(cache.stack, cache.resolve_address(member)) is None:
                    new_obj = {} if is_json_object(member) else []
                    cache.str = is_json_object(member)
                    cache.stack[cache.resolve_address(member)] = new_obj
                    cache.next = new_obj
                    target[name] = _clone_object(cache, member)
                else:
                    target[name] = cache.stack[cache.resolve_address(member)]
            else:
                target[name] = member
    else:
        # Array logic
        for member in obj:
            if is_json_object(member) or isinstance(member, list):
                if get_field_by_key(cache.stack, cache.resolve_address(member)) is None:
                    new_obj = {} if is_json_object(member) else []
                    cache.str = is_json_object(member)
                    cache.stack[cache.resolve_address(member)] = new_obj
                    cache.next = new_obj
                    target.append(_clone_object(cache, member))
                else:
                    target.append(cache.stack[cache.resolve_address(member)])
            else:
                target.append(member)

    cache.level -= 1
    return target

def get_field_by_key(obj, key):
    """
    Gets a field of an object by key.

    :param obj: The object.
    :param key: The key.
    :return: obj[key] if object has the field, otherwise None.
    """
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)

def get_keys_sorted(obj):
    """
    Gets keys sorted of given object.

    :param obj: The object.
    :return: A list of sorted keys.
    """
    keys = list(obj.keys()) if isinstance(obj, dict) else list(obj.__dict__.keys())
    keys.sort(key=str.lower)
    return keys

def is_json_object(obj):
    """
    Checks if given object is a JSON object (dictionary or mapped class).

    :param obj: The object to check.
    :return: True if it's considered a JSON object, False otherwise.
    """
    if obj is None or isinstance(obj, (list, str, int, float, bool)):
        return False

    is_dict = isinstance(obj, dict)
    class_name = obj.__class__.__name__
    is_mapped_class = hasattr(obj, "__class__") and class_name in _RICH_JSON_CLASS_MAPPING

    return is_dict or is_mapped_class

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