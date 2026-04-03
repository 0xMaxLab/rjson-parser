import unittest
import json
import logging
from main.module.rich_json_module import (
    RichJsonModule,
    register_module,
    include_module,
    exclude_module,
    unregister_module
)
from main.helper.rich_json_helper import (
    concat_arrays,
    concat_strings,
    merge_objects,
    clone_object, merge_into_target
)
from main.core.rich_json import RichJsonParser
from main.helper.rich_json_is_resolved import is_resolved
from main.other.rich_json_environment import add_environment_variable
from main.other.rich_json_class_mapping import add_class_mapping

# --- Test-Hilfsklasse ---
class RichJsonTestClass:
    def __init__(self):
        self.value = 0

def stringify(obj):
    """Entspricht json-stable-stringify."""
    return json.dumps(obj, sort_keys=True, default=lambda o: o.__dict__ if hasattr(o, '__dict__') else str(o))

class TestRichJsonSuite(unittest.TestCase):

    def setUp(self):
        self.parser = RichJsonParser()

    def test_module(self):
        content = {"first": "$ilog:Hello World!"}

        module = RichJsonModule("test")
        module.add_command("ilog", lambda p, c: "success")

        register_module(module)
        include_module("test")
        self.parser.parse(content, is_root=True)

        self.assertEqual(content["first"], "success")

        # Cleanup
        exclude_module("test")
        unregister_module("test")
        content_reset = {"first": "$ilog:Hello World!"}
        try:
            self.parser.parse(content_reset, is_root=True)
        except:
            pass
        self.assertEqual(content_reset["first"], "$ilog:Hello World!")

    def test_constructor(self):
        add_class_mapping("RichJsonTestClass", RichJsonTestClass)
        content = {
            "first=RichJsonTestClass": {
                "value": 100,
                "second": {"fourth": "fourth"}
            },
            "second=RichJsonTestClass::first": {
                "third": "third"
            }
        }
        self.parser.parse(content, is_root=True)

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
        self.parser.parse(content, is_root=True)

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
        self.parser.parse(content, is_root=True)
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
        self.parser.parse(content, is_root=True)
        self.assertEqual(content["first"]["third"]["fourth"], "fifth")

    def test_array(self):
        content = {
            "first": [{"second": "second"}],
            "third": "$ref:first[0]",
        }
        self.parser.parse(content, is_root=True)
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
        self.parser.parse(content, is_root=True)
        self.assertEqual(content["fourth"], "test_third_test")
        self.assertEqual(content["fifth"], "test_{ $ref:first/third }")
        self.assertEqual(content["sixth"], "test_{$ref:first/third/third}second")
        self.assertEqual(content["seventh"], "test_{$ref:first/third/third}")
        self.assertEqual(content["eigth"], "third")

    def test_is_resolved(self):
        content = {"first": "$ref:second", "second": "second"}
        self.assertFalse(is_resolved(content))
        content = {"first": "{$ref:second}", "second": "second"}
        self.assertFalse(is_resolved(content))

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
        self.parser.parse(content, is_root=True)
        self.assertEqual(content["first"]["third"]["fourth"], content["fourth"]["fifth"])
        self.assertIs(content["fourth"]["seventh"]["eigth"], content["fourth"])

    def test_env(self):
        add_environment_variable("RichJsonTestEnv", "Hello World!")
        content = {"env": "$env:RichJsonTestEnv"}
        self.parser.parse(content, is_root=True)
        self.assertEqual(content["env"], "Hello World!")

    def test_this(self):
        content = {"this": "$this:"}
        self.parser.parse(content, is_root=True)
        self.assertIs(content, content["this"])
        self.assertIs(content["this"], content["this"]["this"])

    def test_merge(self):
        content = {
            "first": {
                "second": {"second": "second"},
                "third": {"fourth": "Hello World!"}
            },
            "fourth": {"fifth": "$merge:first/second, first/third"},
            "seventh": ["v1", "v2"], "eigth": ["v3", "v4"],
            "ninth": "$merge:seventh, eigth",
            "tenth": "$merge:ninth, eigth",
        }
        self.parser.parse(content, is_root=True)
        expected_merge = merge_objects(content["first"]["second"], content["first"]["third"])
        self.assertEqual(stringify(content["fourth"]["fifth"]), stringify(expected_merge))
        self.assertEqual(content["tenth"], ["v1", "v2", "v3", "v4", "v3", "v4"])

    def test_copy(self):
        content = {
            "first": {"second": "second", "test": "$copy:first"},
            "third": "$copy:first"
        }
        self.parser.parse(content, is_root=True)
        self.assertIsNot(content["first"], content["third"])
        self.assertEqual(stringify(content["first"]), stringify(content["third"]))

    def test_clone_key(self):
        content = {"$clone:first": {"second": "second"}}
        clone_container = {"$clone:first": content["$clone:first"]}
        self.parser.parse(clone_container, is_root=True)
        self.assertIsNot(content["$clone:first"], clone_container["first"])

    def test_invoke(self):
        content = {
            "function": lambda: 4 + 2,
            "function_result": "$ref$invoke:function",
        }
        self.parser.parse(content, is_root=True)
        self.assertEqual(content["function"](), 6)
        self.assertEqual(content["function_result"], 6)

    # Mock-Bereich für Dateisystem-Commands
    def test_file_folder_mocked(self):
        # In einer echten Umgebung müssten hier 'unittest.mock'
        # oder physische Dateien verwendet werden.
        pass

if __name__ == '__main__':
    unittest.main()