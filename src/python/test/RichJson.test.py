import json
import unittest

from main.core.rich_json import parse_rich_json, set_command_enabled
from main.helper.rich_json_helper import (
    merge_objects,
)
from main.core.rich_json_constants import _RICH_JSON_KEY_COMMAND_MEMBER
from main.helper.rich_json_is_resolved import is_resolved
from main.helper.rich_json_keep_key_commands import keep_key_commands
from main.module.rich_json_module import (
    RichJsonModule,
    register_module,
    include_module,
    exclude_module,
    unregister_module
)
from main.other.rich_json_class_mapping import add_class_mappings
from main.other.rich_json_configuration import update_configuration
from main.other.rich_json_environment import add_environment_variable


class RichJsonTestClass:
    def __init__(self):
        self.value = 0


def stringify(obj):
    return json.dumps(obj, sort_keys=True, default=lambda o: o.__dict__ if hasattr(o, '__dict__') else str(o))

update_configuration({"infoEnabled": True, "debugEnabled": True})

class TestRichJsonSuite(unittest.TestCase):

    def test_module_extended(self):
        content = {
            "$ilog:keepKeyCommand": {
                "first": "Hello World!",
            },
            "$dlog:debug": {
                "first": "Hello World!",
            }
        }

        module = RichJsonModule("test")

        def ilog_command(parser, context):
            keep_key_commands(context.current_member)
            print(f"rich_json_module_ilog_ok: {context.current_member['first']}")
            context.current_member["first"] = "success"
            return context.current_member

        def dlog_late_apply(parser, context):
            print(f"rich_json_module_dlog_ok: {context.current_member['first']}")
            context.current_member["first"] = "success"
            return context.current_member

        module.add_command("ilog", ilog_command)
        module.add_late_apply("dlog", dlog_late_apply)

        register_module(module)
        include_module("test")

        parse_rich_json(content)

        self.assertIsNotNone(content)
        self.assertTrue(_RICH_JSON_KEY_COMMAND_MEMBER in content["keepKeyCommand"])
        self.assertEqual(content["keepKeyCommand"]["first"], "success")
        self.assertEqual(content["debug"]["first"], "success")

        content = {
            "$ilog:keepKeyCommand": {
                "first": "Hello World!",
            }
        }

        exclude_module("test")
        unregister_module("test")

        try:
            parse_rich_json(content, is_root=True)
        except Exception:
            # Ignore parser errors for unregistered commands
            pass

        self.assertEqual(content["$ilog:keepKeyCommand"]["first"], "Hello World!")

    def test_constructor(self):
        add_class_mappings({"RichJsonTestClass": RichJsonTestClass})
        add_class_mappings({"RichJsonTestClass": RichJsonTestClass})
        content = {
            "first=RichJsonTestClass": {
                "value": 100,
                "second": {"fourth": "fourth"}
            },
            "second==RichJsonTestClass::first": {
                "third": "third"
            }
        }
        parse_rich_json(content)

        self.assertEqual(content["second"].value, 0)
        self.assertEqual(stringify(content["first"].second), stringify(content["second"].second))
        self.assertIsInstance(content["first"], RichJsonTestClass)
        self.assertIsInstance(content["second"], RichJsonTestClass)

    def test_inheritance(self):
        content = {
            "first::second, third": {
                "x": 10, "y": 5,
                "other": "$ref:second"
            },
            "second::third": {"x": 5},
            "third::first": {"other": "$ref:first"}
        }
        parse_rich_json(content)

        self.assertEqual(content["first"]["x"], 10)
        self.assertIs(content["first"]["other"], content["second"])
        self.assertEqual(content["second"]["y"], 5)
        self.assertEqual(content["third"]["x"], 10)

    def test_batch(self):
        content = {
            "first": {
                "second": "second",
                "$clone:third": {"fourth": "fourth"}
            },
            "fourth": {
                "fifth": "fifth",
                "sixth": "$ref$clone:first/third"
            }
        }
        parse_rich_json(content)
        self.assertEqual(stringify(content["fourth"]["sixth"]), stringify(content["first"]["third"]))
        self.assertIsNot(content["fourth"]["sixth"], content["first"]["third"])

    def test_pipe(self):
        content = {
            "first": {
                "second": "second",
                "third": {"fourth": "$ref:fourth|fifth"}
            },
            "fourth": {
                "fifth": "fifth",
                "sixth": "$ref:first/third"
            }
        }
        parse_rich_json(content)
        self.assertEqual(content["first"]["third"]["fourth"], "fifth")

    def test_array(self):
        content = {
            "first": [{"second": "second"}],
            "third": "$ref:first[0]",
        }
        parse_rich_json(content)
        self.assertIs(content["first"][0], content["third"])

    def test_interpolation(self):
        content = {
            "first": {
                "first": "first", "second": "second", "third": "third",
                "fourth": {"success": "success"}
            },
            "fourth": "test_{$ref:    first/third  }_test",
            "fifth": "test_{{} $ref:first/third {}}",
            "sixth": "test_{{}$ref:first/{$ref:first/third   }/third{}}{$ref:first/second}",
            "seventh": "test_{{}$ref:first/{$ref:{$ref:first/first}/{$ref:  first/third } }/third{}}",
            "eigth": "$ref:first/{$ref:first/third}"
        }
        parse_rich_json(content)
        self.assertEqual(content["fourth"], "test_third_test")
        self.assertEqual(content["fifth"], "test_{ $ref:first/third }")
        self.assertEqual(content["sixth"], "test_{$ref:first/third/third}second")
        self.assertEqual(content["seventh"], "test_{$ref:first/third/third}")
        self.assertEqual(content["eigth"], "third")

    def test_is_resolved(self):
        content = {
            "first": "$ref:second",
            "second": "second",
            "third": False,
            "fifth": {
                "idk": "$ref:second"
            }
        }
        self.assertFalse(is_resolved(content))
        content = {
            "first": "$ref:second",
            "second": "second",
            "third": False,
            "fifth": {
                "idk": "$ref:second"
            }
        }
        self.assertFalse(is_resolved(content))

    def test_set_command_enabled(self):
        content = {
            "first": {
                "second": "second"
            },
            "third": "#ref:first/second",
        }

        set_command_enabled("ref", False)

        try:
            parse_rich_json(content)
        except:
            #ignore
            pass

        set_command_enabled("ref", True)

        self.assertEqual("#ref:first/second", content["third"])


    def test_ref(self):
        content = {
            "first": {
                "second": "second",
                "third": {"fourth": "$ref:fourth/fifth"}
            },
            "fourth": {
                "fifth": "$ref:first/third/fourth",
                "sixth": "$ref:fourth/seventh",
                "seventh": {"eigth": "$ref:fourth"}
            }
        }
        parse_rich_json(content)
        self.assertEqual(content["first"]["third"]["fourth"], content["fourth"]["fifth"])
        self.assertIs(content["fourth"]["seventh"]["eigth"], content["fourth"])

    def test_env(self):
        add_environment_variable("RichJsonTestEnv", "Hello World!")
        content = {
            "$env:a": {
                "RichJsonTestEnv2": {
                    "message": "Hello World!!"
                }
            },
            "env1": "$env:RichJsonTestEnv",
            "env2": "$env:RichJsonTestEnv2/message"
        }
        parse_rich_json(content)
        self.assertEqual(content["env1"], "Hello World!")
        self.assertEqual(content["env2"], "Hello World!!")

    def test_this(self):
        content = {"this": "$this:"}
        parse_rich_json(content)
        self.assertIs(content, content["this"])
        self.assertIs(content["this"], content["this"]["this"])

    def test_merge(self):
        content = {
            "first": {
                "second": {"second": "second"},
                "third": {"fourth": "Hello World!"}
            },
            "fourth": {"fifth": "$merge:first/second, first/third"},
            "seventh": ["v1", "v2"],
            "eight": ["v3", "v4"],
            "ninth": "$merge:seventh, eight",
            "tenth": "$merge:ninth, eight",
        }
        parse_rich_json(content)
        expected_merge = merge_objects(content["first"]["second"], content["first"]["third"])
        self.assertEqual(stringify(content["fourth"]["fifth"]), stringify(expected_merge))
        tenth = []
        tenth.extend(content["seventh"])
        tenth.extend(content["eight"])
        tenth.extend(content["eight"])
        self.assertEqual(content["tenth"], tenth)

    def test_copy(self):
        content = {
            "first": {"second": "second", "test": "$copy:first"},
            "third": "$copy:first"
        }
        parse_rich_json(content)
        self.assertIsNot(content["first"], content["third"])
        self.assertEqual(stringify(content["first"]), stringify(content["third"]))

    def test_clone(self):
        content = {"$clone:first": {"second": "second"}}
        clone_container = {"$clone:first": content["$clone:first"]}
        parse_rich_json(clone_container)
        self.assertIsNot(content["$clone:first"], clone_container["first"])

    def test_clone_crash_on_nested(self):
        content = {
            "$clone:first": {
                "$clone:first": {
                    "third": "third",
                    "fourth": "fourth"
                },
                "second": "second"
            }
        }

        update_configuration({"crashOnNestedClone": True})

        had_exception = False
        try:
            parse_rich_json(content)
        except:
            had_exception = True

        update_configuration({"crashOnNestedClone": False})

        self.assertTrue(had_exception)

    def test_invoke(self):
        content = {
            "function": lambda: 4 + 2,
            "function_result": "$ref$invoke:function",
        }
        parse_rich_json(content)
        self.assertEqual(content["function"](), 6)
        self.assertEqual(content["function_result"], 6)

    def test_file(self):
        content = {
            "file": "$file:resources/json/test0"
        }

        parse_rich_json(content)

        assert content["file"]["root0"] is True

    def test_folder(self):
        content = {
            "folder": "$folder:resources/json"
        }

        parse_rich_json(content)

        assert content["folder"]["test0"]["root0"] is True
        assert content["folder"]["test1"]["root0"] is True

    def test_merge_folder(self):
        content = {
            "folder": "$merge_folder:resources/json"
        }

        parse_rich_json(content)

        assert content["folder"]["root0"] is True
        assert content["folder"]["root1"]["prop1"] == "Hello World!"


if __name__ == '__main__':
    unittest.main()
