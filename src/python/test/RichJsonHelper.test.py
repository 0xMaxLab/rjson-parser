import unittest

from main.helper.rich_json_helper import (
    clone_object,
    merge_objects,
    merge_objects_without_rebind
)


class TestRichJsonHelper(unittest.TestCase):

    def setUp(self):
        self.obj3 = {
            "y": 15,
            "data": {
                "name": "obj3",
                "size": 173,
                "age": 15
            },
            "func": lambda *args: 5 + 7
        }
        self.obj2 = {
            "x": 10,
            "data": {
                "age": 17
            },
            "other": self.obj3,
        }
        self.obj1 = {
            "x": 5,
            "y": 5,
            "data": {
                "name": "obj1",
            },
            "other": self.obj2,
            "func": lambda *args: 5 + 5
        }

    def test_merge_objects(self):
        res = merge_objects(self.obj1, self.obj2, self.obj3)

        self.assertEqual(res["x"], 5)
        self.assertEqual(res["y"], 5)
        self.assertEqual(res["data"]["name"], "obj1")
        self.assertEqual(res["data"]["age"], 17)
        self.assertEqual(res["data"]["size"], 173)
        self.assertIs(res["other"], self.obj2)

        self.assertIsNot(res["func"], self.obj1["func"])
        self.assertEqual(res["func"](), self.obj1["func"]())

        self.assertEqual(res["other"]["x"], 10)
        self.assertEqual(res["other"]["y"], 15)
        self.assertEqual(res["other"]["data"]["name"], "obj3")
        self.assertEqual(res["other"]["other"], self.obj3)

        res_reverse = merge_objects(self.obj3, self.obj2, self.obj1)

        self.assertEqual(res_reverse["x"], 10)
        self.assertEqual(res_reverse["y"], 15)
        self.assertEqual(res_reverse["data"]["name"], "obj3")
        self.assertIsNot(res_reverse["func"], self.obj3["func"])
        self.assertEqual(res_reverse["func"](), self.obj3["func"]())

        self.assertEqual(self.obj2["x"], 10)
        self.assertEqual(self.obj2["data"]["size"], 173)
        self.assertEqual(self.obj3["y"], 15)

    def test_merge_objects_without_rebind(self):
        res = merge_objects_without_rebind(self.obj1, self.obj2, self.obj3)

        self.assertEqual(res["x"], 5)
        self.assertEqual(res["data"]["age"], 17)
        self.assertIs(res["other"], self.obj2)

        self.assertIs(res["func"], self.obj1["func"])
        self.assertEqual(res["func"](), self.obj1["func"]())

        res_reverse = merge_objects_without_rebind(self.obj3, self.obj2, self.obj1)
        self.assertEqual(res_reverse["x"], 10)
        self.assertIs(res_reverse["func"], self.obj3["func"])

    def test_clone_object(self):
        obj = {
            "y": 15,
            "data": {
                "name": "obj3",
                "size": 173,
                "age": 15
            },
            "func": lambda *args: 5 + 7,
            "array": [],
        }
        obj["self"] = obj
        obj["array"].append(obj)

        res = clone_object(obj)

        self.assertIsNot(res, obj)
        self.assertIsNot(res["data"], obj["data"])
        self.assertIsNot(res["func"], obj["func"])
        self.assertIsNot(res["array"], obj["array"])

        self.assertIs(res["self"], res)
        self.assertIs(res["array"][0], res)

        self.assertEqual(res["y"], 15)
        self.assertEqual(res["self"]["y"], 15)
        self.assertEqual(res["data"]["name"], "obj3")
        self.assertEqual(res["func"](), 12)


if __name__ == '__main__':
    unittest.main()
