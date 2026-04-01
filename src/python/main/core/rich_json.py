from .rich_json_cache import RichJsonCache
from .rich_json_command_holder import set_command_enabled, _throw_command_not_found
from ..helper.rich_json_helper import (
    concat_arrays, concat_strings,
    get_field_by_key, get_keys_sorted, is_json_object, matches_wildcard, merge_into_target, clone_object,
    _merge_into_target
)
from ..other.rich_json_class_mapping import _map_class_by_name
from ..other.rich_json_configuration import _RICH_JSON_CONFIG

from .rich_json_constants import (
    _RICH_JSON_COMMAND_PREFIX,
    _RICH_JSON_COMMAND_SUFFIX,
    _RICH_JSON_COMMAND_WILDCARD,
    _RICH_JSON_COMMAND_DELIMITER,
    _RICH_JSON_COMMAND_PATH_DELIMITER,
    _RICH_JSON_COMMAND_PIPE_SIGN,
    _RICH_JSON_COMMAND_REF,
    _RICH_JSON_COMMAND_CLONE,
    _RICH_JSON_KEY_COMMAND_MEMBER,
    _RICH_JSON_ARRAY_WILDCARD,
    _RICH_JSON_ARRAY_DELIMITERS,
    _RICH_JSON_ARRAY_REPLACE_SUBSTRING,
    _RICH_JSON_ARRAY_REPLACE_NEWSTRING,
    _RICH_JSON_CONSTRUCTOR_SIGN,
    _RICH_JSON_LATE_CONSTRUCTOR_SIGN,
    _RICH_JSON_LATE_CONSTRUCTOR_MEMBER,
    _RICH_JSON_INHERITANCE_SIGN,
    _RICH_JSON_NAME_IS_COMMAND,
    _RICH_JSON_NAME_IS_CONSTRUCTOR,
    _RICH_JSON_NAME_IS_LATE_CONSTRUCTOR,
    _RICH_JSON_NAME_IS_INHERITANCE,
    _RICH_JSON_INTERPOLATION_WILDCARD,
    _RICH_JSON_INTERPOLATION_OPENING_SIGN,
    _RICH_JSON_INTERPOLATION_CLOSING_SIGN
)


# Abstraction for getting/setting fields for both dicts and lists
def get_object_field(obj, name, i): return obj[name]
def set_object_field(obj, name, i, value): obj[name] = value
def get_array_element(arr, name, i): return arr[i]
def set_array_element(arr, name, i, value): arr[i] = value

class RichJsonContext:
    def __init__(self):
        self.root = None
        self.current = None
        self.current_command = None
        self.current_member = None
        self.current_address = None
        self.current_name = None

class RichJsonParser:
    def __init__(self):
        self.cache = RichJsonCache()
        self.con = RichJsonContext()

    def parse(self, current, is_root=False):
        self.con.current = current
        self.cache.level += 1

        if is_root:
            self.con.root = current
            self.con.current = current
            self.con.current_member = current
            self.con.current_address = self.cache.resolve_address(current)
            self.con.current = self.__parse_rich_json_in_member()
            self.cache.level -= 1
            if self.cache.level == 0 and _RICH_JSON_CONFIG.get("debugEnabled"):
                print("RichJson was applied successfully.")
            return current

        is_json_obj = is_json_object(current)
        current_name = self.con.current_name
        current_address = self.con.current_address

        if is_json_obj:
            self.__preprocess_kcommands_constructors_inheritances()
            get_func = get_object_field
            set_func = set_object_field
            names = get_keys_sorted(current)
        else:
            get_func = get_array_element
            set_func = set_array_element
            names = list(range(len(current)))  # Simulate array indices

        for i, name in enumerate(names):
            # If it's a list, name is actually the index 'i'.
            # We map the logic carefully.
            actual_name = name if is_json_obj else i
            self.con.current_member = get_func(current, actual_name, i)

            is_member_obj_or_list = is_json_object(self.con.current_member) or isinstance(self.con.current_member, list)
            suffix = f"_{actual_name}" if is_json_obj else f"_{i}"

            self.con.current_address = (
                self.cache.resolve_address(self.con.current_member)
                if is_member_obj_or_list
                else concat_strings(current_address, suffix)
            )

            self.con.current_name = actual_name if is_json_obj else f'"{current_name}_{i}'
            self.con.current_member = self.__parse_rich_json_in_member()
            set_func(current, actual_name, i, self.con.current_member)

        self.cache.level -= 1
        return current

    def __preprocess_kcommands_constructors_inheritances(self):
        names = list(self.con.current.keys())
        for name in names:
            iscmd = _RICH_JSON_NAME_IS_COMMAND(name)
            isctr = _RICH_JSON_NAME_IS_CONSTRUCTOR(name)
            isite = _RICH_JSON_NAME_IS_INHERITANCE(name)

            if iscmd or isctr or isite:
                member = self.con.current[name]
                del self.con.current[name]

                # Split key commands before inheritances
                if iscmd:
                    name_parts = name.split(_RICH_JSON_COMMAND_SUFFIX, 1)
                    kcmd = name_parts[0][1:].split(_RICH_JSON_COMMAND_PREFIX)
                    member[_RICH_JSON_KEY_COMMAND_MEMBER] = kcmd
                    name = name_parts[1]

                # Split inheritances before constructor (<name>=<class>::<inheritances>)
                if isite:
                    name_parts = name.split(_RICH_JSON_INHERITANCE_SIGN, 1)
                    ite = name_parts[1].strip()
                    name = name_parts[0]

                if isctr:
                    if _RICH_JSON_NAME_IS_LATE_CONSTRUCTOR(name):
                        name_parts = name.split(_RICH_JSON_LATE_CONSTRUCTOR_SIGN, 1)
                        member[_RICH_JSON_LATE_CONSTRUCTOR_MEMBER] = _map_class_by_name(name_parts[1].strip())
                        name = name_parts[0]
                    else:
                        name_parts = name.split(_RICH_JSON_CONSTRUCTOR_SIGN, 1)
                        ctr = _map_class_by_name(name_parts[1].strip())
                        temp_cache = RichJsonCache()
                        member = merge_into_target(temp_cache, ctr(), member, True)
                        name = name_parts[0]

                if isite:  # New object reference after constructor call
                    self.cache.inheritances[self.cache.resolve_address(member)] = ite

                self.con.current[name.strip()] = member
                if not is_json_object(member):
                    raise Exception(f"Inheritance on member '{name}' is not possible, because it is not an object.")

    def __parse_rich_json_in_member(self):
        if self.con.current_address in self.cache.stack:
            if _RICH_JSON_CONFIG.get("debugEnabled"):
                print(f"RichJson cache <-- '{self.con.current_address}' {self.cache.stack[self.con.current_address]}")
            return self.cache.stack[self.con.current_address]
        else:
            if _RICH_JSON_CONFIG.get("debugEnabled"):
                print(f"RichJson cache --> '{self.con.current_address}' {self.con.current_member}")
            self.cache.stack[self.con.current_address] = self.con.current_member

        if not self.__is_member_rich_json_able(self.con.current_member):
            return self.con.current_member

        if isinstance(self.con.current_member, str):
            if _RICH_JSON_CONFIG.get("stringInterpolationsEnabled") and matches_wildcard(self.con.current_member, _RICH_JSON_INTERPOLATION_WILDCARD):
                interpolation_result = self.__parse_interpolations()
                self.con.current_member = interpolation_result["result"]
                if not interpolation_result["is_parsed"]:
                    return self.con.current_member
            return self.__execute_rich_json_command_if_contained_in_member()
        else:
            kcmd_ignored = []
            current_address = self.con.current_address
            is_json_obj = is_json_object(self.con.current_member)

            if is_json_obj:
                self.__execute_clone()  # clone must be done first
                self.__call_constructor()
                self.cache.stack[current_address] = self.con.current_member
                kcmd_ignored = self.__get_ignores_for_key_commands()
                for _ignored in kcmd_ignored:
                    set_command_enabled(_ignored, False)
                self.__resolve_inheritances()

            self.con.current_member = self.parse(self.con.current_member)

            if is_json_obj:
                self.__reset_clone_if_possible(current_address)
                for _ignored in kcmd_ignored:
                    set_command_enabled(_ignored, True)
                self.con.current_member = self.__execute_key_commands()

            return self.con.current_member

    def __is_member_rich_json_able(self, member):
        return isinstance(member, str) or isinstance(member, list) or is_json_object(member)

    def __parse_interpolations(self):
        rv = ""
        inp = self.con.current_member
        ipn_level = -1
        ipns = []
        i = 0

        while i <= len(inp):
            c = inp[i] if i < len(inp) else ""
            if c == _RICH_JSON_INTERPOLATION_OPENING_SIGN:
                c_next = inp[i + 1] if i + 1 < len(inp) else ""
                c_next_next = inp[i + 2] if i + 2 < len(inp) else ""
                if (c_next in (_RICH_JSON_INTERPOLATION_OPENING_SIGN, _RICH_JSON_INTERPOLATION_CLOSING_SIGN)) and c_next_next == _RICH_JSON_INTERPOLATION_CLOSING_SIGN:
                    rv += c_next
                    i += 2
                else:
                    ipn_level += 1
            elif c == _RICH_JSON_INTERPOLATION_CLOSING_SIGN:
                self.con.current_member = ipns[ipn_level]["rv"]
                ipns[ipn_level]["rv"] = ""
                ipn_level -= 1

                if len(ipns) == ipn_level + 3 and not ipns[ipn_level + 2]["is_parsed"]:
                    self.con.current_member = concat_strings(_RICH_JSON_INTERPOLATION_OPENING_SIGN, self.con.current_member, _RICH_JSON_INTERPOLATION_CLOSING_SIGN)
                else:
                    self.con.current_member = self.__execute_rich_json_command_if_contained_in_member()

                ipn_parsed = not matches_wildcard(self.con.current_member, _RICH_JSON_COMMAND_WILDCARD)
                if not ipn_parsed:
                    ipns[ipn_level + 1]["is_parsed"] = False

                if not ipn_parsed:
                    self.con.current_member = concat_strings(_RICH_JSON_INTERPOLATION_OPENING_SIGN, self.con.current_member, _RICH_JSON_INTERPOLATION_CLOSING_SIGN)

                if ipn_level == -1:
                    rv += self.con.current_member
                else:
                    ipns[ipn_level]["rv"] += self.con.current_member
            elif ipn_level > -1 and c != "":
                if len(ipns) < ipn_level + 1:
                    ipns.append({"rv": "", "is_parsed": True})
                ipns[ipn_level]["rv"] += c
            elif c != "":
                rv += c
            i += 1

        self.cache.stack[self.con.current_address] = rv
        return {"result": rv, "is_parsed": True if len(ipns) == 0 else ipns[0]["is_parsed"]}

    def __get_ignores_for_key_commands(self):
        rv = []
        if _RICH_JSON_KEY_COMMAND_MEMBER in self.con.current_member:
            for kcmd in self.con.current_member[_RICH_JSON_KEY_COMMAND_MEMBER]:
                if self.__is_rich_json_command_enabled(kcmd) and kcmd in _RICH_JSON_COMMANDS.kcmd_ignored:
                    rv = concat_arrays(rv, _RICH_JSON_COMMANDS.kcmd_ignored[kcmd])
        return rv

    def __execute_rich_json_command_if_contained_in_member(self):
        if matches_wildcard(self.con.current_member, _RICH_JSON_COMMAND_WILDCARD):
            self.cache.stack[self.con.current_address] = {}
            parts = self.con.current_member.split(_RICH_JSON_COMMAND_SUFFIX, 1)
            self.con.current_command = parts[0]
            self.con.current_member = parts[1].strip()
            self.con.current_member = self.__try_rich_json_command()
            self.__reset_clone_if_possible(self.con.current_address)

            if callable(self.con.current_member) and is_json_object(self.con.current_member):
                merge_into_target(self.cache.stack[self.con.current_address], self.con.current_member)
            else:
                self.cache.stack[self.con.current_address] = self.con.current_member

        return self.con.current_member

    def __try_rich_json_command(self):
        try:
            unresolved_command = self.con.current_command
            self.con.current_command = self.con.current_command[1:]  # remove prefix
            self.con.current_member = self.con.current_member.replace(_RICH_JSON_ARRAY_REPLACE_SUBSTRING, _RICH_JSON_ARRAY_REPLACE_NEWSTRING)
            unresolved_member = self.con.current_member

            pipe_commands = None
            if _RICH_JSON_COMMAND_PIPE_SIGN in self.con.current_member:
                pipe_commands = self.con.current_member.split(_RICH_JSON_COMMAND_PIPE_SIGN)
                self.con.current_member = pipe_commands.pop(0)

            batch_commands = self.con.current_command.split(_RICH_JSON_COMMAND_PREFIX)
            for cmd in batch_commands:
                self.con.current_command = cmd
                if self.__is_rich_json_command_enabled(self.con.current_command):
                    if matches_wildcard(self.con.current_member, _RICH_JSON_ARRAY_WILDCARD):
                        array_parts = _RICH_JSON_ARRAY_DELIMITERS.split(self.con.current_member, 2)
                        self.con.current_member = array_parts[0]
                        # Execute command function
                        self.con.current_member = _RICH_JSON_COMMANDS.enabled[self.con.current_command](self, self.con)
                        # Access index
                        index = int(array_parts[1].strip()) if array_parts[1].strip().isdigit() else array_parts[1].strip()
                        self.con.current_member = self.con.current_member[index]
                    else:
                        self.con.current_member = _RICH_JSON_COMMANDS.enabled[self.con.current_command](self, self.con)
                else:
                    return f"{unresolved_command}{unresolved_member}"

            if pipe_commands is None:
                return self.con.current_member

            root = self.con.root
            for pipe_cmd in pipe_commands:
                cmd_parts = pipe_cmd.split(_RICH_JSON_COMMAND_SUFFIX, 1)
                if len(cmd_parts) == 1:
                    cmd_parts.insert(0, _RICH_JSON_COMMAND_REF)
                self.con.root = self.con.current_member
                self.con.current_member = cmd_parts[1].strip()
                self.con.current_command = cmd_parts[0].strip()
                self.con.current_member = self.__try_rich_json_command()

                if matches_wildcard(self.con.current_member, _RICH_JSON_COMMAND_WILDCARD):
                    return f"{unresolved_command}{unresolved_member}"

            self.con.root = root
            return self.con.current_member
        except Exception as exception:
            print(f"Error: {exception}")
            raise Exception(f"RichJson {_RICH_JSON_COMMAND_PREFIX}{self.con.current_command} could not be resolved in {self.con.current_name}.")

    def __is_rich_json_command_enabled(self, command):
        if command not in _RICH_JSON_COMMANDS.available:
            _throw_command_not_found(command)
        return _RICH_JSON_COMMANDS.enabled[command] != _RICH_JSON_COMMANDS.void_command

    def __execute_clone(self):
        if _RICH_JSON_KEY_COMMAND_MEMBER in self.con.current_member:
            key_commands = self.con.current_member[_RICH_JSON_KEY_COMMAND_MEMBER]
            if _RICH_JSON_COMMAND_CLONE in key_commands and self.__is_rich_json_command_enabled(_RICH_JSON_COMMAND_CLONE):
                self.con.current_command = _RICH_JSON_COMMAND_CLONE
                self.con.current_member = self.__try_rich_json_key_command()
                key_commands = self.con.current_member[_RICH_JSON_KEY_COMMAND_MEMBER]
                key_commands.remove(_RICH_JSON_COMMAND_CLONE)

    def __call_constructor(self):
        if _RICH_JSON_CONFIG.get("lateConstructorEnabled") and _RICH_JSON_LATE_CONSTRUCTOR_MEMBER in self.con.current_member:
            cstr = self.con.current_member[_RICH_JSON_LATE_CONSTRUCTOR_MEMBER]
            self.con.current_member = _merge_into_target(cstr(), self.con.current_member)
            del self.con.current_member[_RICH_JSON_LATE_CONSTRUCTOR_MEMBER]
            if _RICH_JSON_CONFIG.get("debugEnabled"):
                print(f"RichJson resolved construct for '{type(cstr)}'.")

    def _resolve_inheritances(self):
        inheritance_val = get_field_by_key(self.cache.inheritances, self.con.current_address)
        if inheritance_val is None:
            return

        chain = inheritance_val.split(_RICH_JSON_COMMAND_DELIMITER)
        member = self.con.current_member

        for ite in chain:
            self.con.current_member = ite.strip()
            if matches_wildcard(self.con.current_member, _RICH_JSON_COMMAND_WILDCARD):
                parts = self.con.current_member.split(_RICH_JSON_COMMAND_SUFFIX, 1)
                self.con.current_command = parts[0].strip()
                self.con.current_member = parts[1].strip()
            else:
                self.con.current_command = _RICH_JSON_COMMAND_REF

            self.con.current_member = merge_into_target(member, clone_object(self._try_rich_json_command()))

    def _reset_clone_if_possible(self, address):
        if self.cache.clone_address == address:
            self.cache.clone_address = None

    def _execute_key_commands(self):
        if isinstance(self.con.current_member, dict) and _RICH_JSON_KEY_COMMAND_MEMBER in self.con.current_member:
            key_commands = list(self.con.current_member[_RICH_JSON_KEY_COMMAND_MEMBER])
            for kcmd in key_commands:
                if self._is_rich_json_command_enabled(kcmd):
                    self.con.current_command = kcmd
                    self.con.current_member = self._try_rich_json_key_command()
            del self.con.current_member[_RICH_JSON_KEY_COMMAND_MEMBER]
        return self.con.current_member

    def _try_rich_json_key_command(self):
        return _RICH_JSON_COMMANDS.enabled[self.con.current_command](self, self.con)