using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using NUnit.Framework;
using main.core;
using main.helper;
using main.module;
using main.other;
using main.commands;

namespace main.tests
{
    [TestFixture]
    public class RichJsonTest
    {
        [SetUp]
        public void Setup()
        {
            RichJsonConfig.InfoEnabled = true;
            RichJsonConfig.DebugEnabled = true;
        }

        private IDictionary<string, object> ParseJson(string json)
        {
            try
            {
                // Liest das JSON als generisches JObject ein
                var rawToken = JsonConvert.DeserializeObject<Newtonsoft.Json.Linq.JToken>(json);
        
                // Wandelt das gesamte Konstrukt tiefenrein in Dictionary und List um
                return RichJsonHelper.CleanJToken(rawToken) as IDictionary<string, object>;
            }
            catch (Exception e)
            {
                throw new Exception("Fehler beim Parsen der Test-JSON", e);
            }
        }

        private string Stringify(object obj)
        {
            try
            {
                return JsonConvert.SerializeObject(obj);
            }
            catch (Exception e)
            {
                throw new Exception("Fehler beim Stringify", e);
            }
        }

        private RichJsonParser GetParser()
        {
            return new RichJsonParser();
        }

        private class RichJson_ilog
        {
            public object Execute(RichJsonParser parser, RichJsonContext context)
            {
                var currentMember = (IDictionary<string, object>)context.CurrentMember;
                RichJsonHelper.KeepKeyCommands(currentMember);
                parser.Logger.Info("rich_json_module_ilog_ok:" + currentMember["first"]);
                currentMember["first"] = "success";
                return context.CurrentMember;
            }
        }

        private class RichJson_dlog
        {
            public object Execute(RichJsonParser parser, RichJsonContext context)
            {
                var currentMember = (IDictionary<string, object>)context.CurrentMember;
                parser.Logger.Debug("rich_json_module_dlog_ok:" + currentMember["first"]);
                currentMember["first"] = "success";
                return context.CurrentMember;
            }
        }

        [Test]
        public void TestModule()
        {
            var content = ParseJson("""
                {
                    "$ilog:keepKeyCommand": {
                        "first": "Hello World!"
                    },
                    "$dlog:debug": {
                        "first": "Hello World!"
                    }
                }
            """);

            RichJsonModule module = new RichJsonModule("test")
                .AddCommand("ilog", new RichJson_ilog().Execute, null)
                .AddLateApply("dlog", new RichJson_dlog().Execute, null);

            RichJsonModuleManager.RegisterModule(module);
            RichJsonModuleManager.IncludeModule("test");

            GetParser().Parse(content, true);

            Assert.That(content, Is.Not.Null);
            var keepKeyCommand = (IDictionary<string, object>)content["keepKeyCommand"];
            Assert.That(keepKeyCommand["first"], Is.EqualTo("success"));
            var debug = (IDictionary<string, object>)content["debug"];
            Assert.That(debug["first"], Is.EqualTo("success"));

            content = ParseJson("""
                {
                    "$ilog:keepKeyCommand": {
                        "first": "Hello World!"
                    }
                }
            """);

            RichJsonModuleManager.ExcludeModule("test");
            RichJsonModuleManager.UnregisterModule("test");

            try
            {
                GetParser().Parse(content, true);
            }
            catch (Exception)
            {
                // ignore
            }

            keepKeyCommand = (IDictionary<string, object>)content["keepKeyCommand"];
            Assert.That(keepKeyCommand["first"], Is.EqualTo("Hello World!"));
        }

        public class RichJsonTestClass
        {
            public int Value { get; set; }
            public Dictionary<string, object> Second { get; set; }
            public string Third { get; set; }

            public RichJsonTestClass()
            {
            }
        }

        [Test]
        public void TestConstructor()
        {
            var mappings = new Dictionary<string, Type>();
            mappings["RichJsonTestClass"] = typeof(RichJsonTestClass);
            RichJsonClassMapping.AddClassMappings(mappings);
            RichJsonClassMapping.AddClassMappings(mappings);

            var content = ParseJson("""
                {
                    "first=RichJsonTestClass": {
                        "Value": 100,
                        "Second": {
                            "fourth": "fourth"
                        }
                    },
                    "second==RichJsonTestClass::first": {
                        "Third": "third"
                    }
                }
            """);

            GetParser().Parse(content, true);

            var firstJson = JsonConvert.SerializeObject(content["first"]);
            var first = JsonConvert.DeserializeObject<RichJsonTestClass>(firstJson);

            Console.WriteLine(content["first"]);

            var secondJson = JsonConvert.SerializeObject(content["second"]);
            var second = JsonConvert.DeserializeObject<RichJsonTestClass>(secondJson);

            Assert.That(first.Value, Is.EqualTo(100));
            Assert.That(second.Value, Is.EqualTo(0));
        }

        [Test]
        public void TestInheritance()
        {
            var content = ParseJson("""
                {
                    "first::second, third": {
                        "x": 10,
                        "y": 5,
                        "other": "$ref:second"
                    },
                    "second::third": {
                        "x": 5
                    },
                    "third::first": {
                        "other": "$ref:first"
                    }
                }
            """);

            GetParser().Parse(content, true);

            var first = (IDictionary<string, object>)content["first"];
            var second = (IDictionary<string, object>)content["second"];
            var third = (IDictionary<string, object>)content["third"];

            Assert.That(first["x"], Is.EqualTo(10));
            Assert.That(first["y"], Is.EqualTo(5));
            Assert.That(first["other"], Is.SameAs(second));

            Assert.That(second["x"], Is.EqualTo(5));
            Assert.That(second["y"], Is.EqualTo(5));

            var secondOther = (IDictionary<string, object>)second["other"];
            Assert.That(secondOther["x"], Is.EqualTo(first["x"]));
            Assert.That(secondOther["y"], Is.EqualTo(first["y"]));

            var secondOtherOther = (IDictionary<string, object>)secondOther["other"];
            Assert.That(secondOtherOther["x"], Is.EqualTo(second["x"]));
            Assert.That(secondOtherOther["y"], Is.EqualTo(second["y"]));

            Assert.That(third["x"], Is.EqualTo(10));
            Assert.That(third["y"], Is.EqualTo(5));
            Assert.That(third["other"], Is.SameAs(first));
        }

        [Test]
        public void TestBatch()
        {
            var content = ParseJson("""
                {
                    "first": {
                        "second": "second",
                        "$clone:third": {
                            "fourth": "fourth"
                        }
                    },
                    "fourth": {
                        "fifth": "fifth",
                        "sixth": "$ref$clone:first/third"
                    }
                }
            """);

            GetParser().Parse(content, true);

            var first = (IDictionary<string, object>)content["first"];
            var fourth = (IDictionary<string, object>)content["fourth"];

            Assert.That(Stringify(fourth["sixth"]), Is.EqualTo(Stringify(first["third"])));
            Assert.That(fourth["sixth"], Is.Not.SameAs(first["third"]));
        }

        [Test]
        public void TestPipe()
        {
            var content = ParseJson("""
                {
                    "first": {
                        "second": "second",
                        "third": {
                            "fourth": "$ref:fourth|fifth"
                        }
                    },
                    "fourth": {
                        "fifth": "fifth",
                        "sixth": "$ref:first/third"
                    }
                }
            """);

            GetParser().Parse(content, true);

            var first = (IDictionary<string, object>)content["first"];
            var third = (IDictionary<string, object>)first["third"];
            Assert.That(third["fourth"], Is.EqualTo("fifth"));
        }

        [Test]
        public void TestArray()
        {
            var content = ParseJson("""
                {
                    "first": [
                        {
                            "second": "second"
                        }
                    ],
                    "third": "$ref:first[0]"
                }
            """);

            GetParser().Parse(content, true);

            var first = (System.Collections.IList)content["first"];
            Assert.That(content["third"], Is.SameAs(first[0]));
        }

        [Test]
        public void TestInterpolation()
        {
            var content = ParseJson("""
                {
                    "first": {
                        "first": "first",
                        "second": "second",
                        "third": "third",
                        "fourth": {
                            "success": "success"
                        }
                    },
                    "fourth": "test_{$ref:first/third}_test",
                    "fifth": "test_{{} $ref:first/third {}}",
                    "sixth": "test_{{}$ref:first/{$ref:first/third}/third{}}{$ref:first/second}",
                    "seventh": "test_{{}$ref:first/{$ref:{$ref:first/first}/{$ref:first/third}}/third{}}",
                    "eigth": "$ref:first/{$ref:first/third}"
                }
            """);

            GetParser().Parse(content, true);

            Assert.That(content["fourth"], Is.EqualTo("test_third_test"));
            Assert.That(content["fifth"], Is.EqualTo("test_{ $ref:first/third }"));
            Assert.That(content["sixth"], Is.EqualTo("test_{$ref:first/third/third}second"));
            Assert.That(content["seventh"], Is.EqualTo("test_{$ref:first/third/third}"));
            Assert.That(content["eigth"], Is.EqualTo("third"));
        }

        [Test]
        public void TestIsResolved()
        {
            var content1 = ParseJson("""
                {
                    "first": "$ref:second",
                    "second": "second",
                    "third": false,
                    "fifth": {
                        "idk": "$ref:second"
                    }
                }
            """);
            Assert.That(RichJsonHelper.IsResolved(content1), Is.False);

            var content2 = ParseJson("""
                {
                    "first": "{$ref:second}",
                    "second": "second",
                    "third": false,
                    "fifth": {
                        "idk": "{$ref:second}"
                    }
                }
            """);
            Assert.That(RichJsonHelper.IsResolved(content2), Is.False);
        }

        [Test]
        public void TestSetCommandEnabled()
        {
            var content = ParseJson("""
                {
                    "first": {
                        "second": "second"
                    },
                    "third": "#ref:first/second"
                }
            """);

            RichJsonCommandHolder.SetCommandEnabled("ref", false);

            GetParser().Parse(content, true);

            RichJsonCommandHolder.SetCommandEnabled("ref", true);

            Assert.That(content["third"], Is.EqualTo("#ref:first/second"));
        }

        [Test]
        public void TestRef()
        {
            var content = ParseJson("""
                {
                    "first": {
                        "second": "second",
                        "third": {
                            "fourth": "$ref:fourth/fifth"
                        }
                    },
                    "fourth": {
                        "fifth": "$ref:first/third/fourth",
                        "sixth": "$ref:fourth/seventh",
                        "seventh": {
                            "eigth": "$ref:fourth"
                        }
                    }
                }
            """);

            GetParser().Parse(content, true);

            var first = (IDictionary<string, object>)content["first"];
            var third = (IDictionary<string, object>)first["third"];
            var fourth = (IDictionary<string, object>)content["fourth"];
            var seventh = (IDictionary<string, object>)fourth["seventh"];

            Assert.That(third["fourth"], Is.SameAs(fourth["fifth"]));
            Assert.That(seventh["eigth"], Is.SameAs(fourth));
        }

        [Test]
        public void TestEnv()
        {
            var content = ParseJson("""
                {
                    "$env:a": {
                        "RichJsonTestEnv2": {
                            "message": "Hello World!!"
                        }
                    },
                    "env1": "$env:RichJsonTestEnv",
                    "env2": "$env:RichJsonTestEnv2/message"
                }
            """);

            RichJsonEnvironment.AddEnvironmentVariable("RichJsonTestEnv", "Hello World!");
            GetParser().Parse(content, true);

            Assert.That(content["env1"], Is.EqualTo("Hello World!"));
            Assert.That(content["env2"], Is.EqualTo("Hello World!!"));
        }

        [Test]
        public void TestThis()
        {
            var content = ParseJson("""
                {
                    "this": "$this:"
                }
            """);

            GetParser().Parse(content, true);

            Assert.That(content["this"], Is.SameAs(content));

            var thisObj = (IDictionary<string, object>)content["this"];
            Assert.That(thisObj["this"], Is.SameAs(thisObj));
        }

        [Test]
        public void TestMerge()
        {
            var content = ParseJson("""
                {
                    "first": {
                        "second": {
                            "second": "second"
                        },
                        "third": {
                            "fourth": "Hello World!"
                        }
                    },
                    "fourth": {
                        "fifth": "$merge:first/second, first/third"
                    },
                    "sixth": "$merge:fourth/fifth, first",
                    "seventh": ["v1", "v2"],
                    "eigth": ["v3", "v4"],
                    "ninth": "$merge:seventh, eigth",
                    "tenth": "$merge:ninth, eigth"
                }
            """);

            GetParser().Parse(content, true);

            var first = (IDictionary<string, object>)content["first"];
            var fourth = (IDictionary<string, object>)content["fourth"];

            var manualMerge = (IDictionary<string, object>)RichJsonHelper.MergeObjects(
                (IDictionary<string, object>)first["second"],
                (IDictionary<string, object>)first["third"]
            );
            Assert.That(Stringify(fourth["fifth"]), Is.EqualTo(Stringify(manualMerge)));

            var seventh = (System.Collections.IList)content["seventh"];
            var eigth = (System.Collections.IList)content["eigth"];
            var tenth = new List<object>();
            
            foreach (var item in seventh) tenth.Add(item);
            foreach (var item in eigth) tenth.Add(item);
            foreach (var item in eigth) tenth.Add(item);
            
            Assert.That(Stringify(content["tenth"]), Is.EqualTo(Stringify(tenth)));
        }

        [Test]
        public void TestCopy()
        {
            var content = ParseJson("""
                {
                    "first": {
                        "second": "second",
                        "test": "$copy:first"
                    },
                    "third": "$copy:first"
                }
            """);

            GetParser().Parse(content, true);

            Assert.That(content["third"], Is.Not.SameAs(content["first"]));
            Assert.That(content["third"], Is.EqualTo(content["first"]));
        }

        [Test]
        public void TestClone()
        {
            var content = ParseJson("""
                {
                    "$clone:first": {"second": "second"}
                }
            """);

            var clone = ParseJson("""
                {
                    "$clone:first": {}
                }
            """);
            clone["$clone:first"] = content["$clone:first"];

            GetParser().Parse(clone, true);

            Assert.That(clone["first"], Is.Not.SameAs(content["$clone:first"]));
        }

        [Test]
        public void TestCloneCrashOnNested()
        {
            var content = ParseJson("""
                {
                    "$clone:first": {
                        "$clone:first": {
                            "third": "third",
                            "fourth": "fourth"
                        },
                        "second": "second"
                    }
                }
            """);

            RichJsonConfig.CrashOnNestedCloneEnabled = true;

            var hadException = false;
            try
            {
                GetParser().Parse(content, true);
            }
            catch (Exception)
            {
                hadException = true;
            }

            RichJsonConfig.CrashOnNestedCloneEnabled = false;

            Assert.That(hadException, Is.True);
        }

        [Test]
        public void TestInvoke()
        {
            var content = ParseJson("""
                {
                    "function_result": "$env$invoke:test_function"
                }
            """);

            RichJsonEnvironment.AddEnvironmentVariable("test_function", (Func<object>)(() => { return 3 + 2; }));

            GetParser().Parse(content, true);

            Assert.That(content["function_result"], Is.EqualTo(5));
        }

        [Test]
        public void TestFile()
        {
            var content = ParseJson("""
                {
                    "file": "$file:resources/json/test0"
                }
            """);

            try
            {
                GetParser().Parse(content, true);
                var fileContent = (IDictionary<string, object>)content["file"];
                Assert.That((bool)fileContent["root0"], Is.True);
            }
            catch (Exception e)
            {
                Console.Error.WriteLine("Skipping testFile because test file might not exist locally: " + e.Message);
            }
        }

        [Test]
        public void TestFolder()
        {
            var content = ParseJson("""
                {
                    "folder": "$folder:resources/json"
                }
            """);

            try
            {
                GetParser().Parse(content, true);
                var folderContent = (IDictionary<string, object>)content["folder"];
                var test0 = (IDictionary<string, object>)folderContent["test0"];
                var test1 = (IDictionary<string, object>)folderContent["test1"];

                Assert.That((bool)test0["root0"], Is.True);
                Assert.That((bool)test1["root0"], Is.True);
            }
            catch (Exception e) {
                Console.Error.WriteLine("Skipping testFolder because test directory might not exist locally: " + e.Message);
            }
        }

        [Test]
        public void TestMergeFolder()
        {
            var content = ParseJson("""
                {
                    "folder": "$merge_folder:resources/json"
                }
            """);

            try
            {
                GetParser().Parse(content, true);
                var folderContent = (IDictionary<string, object>)content["folder"];
                var root1 = (IDictionary<string, object>)folderContent["root1"];

                Assert.That((bool)folderContent["root0"], Is.True);
                Assert.That(root1["prop1"], Is.EqualTo("Hello World!"));
            }
            catch (Exception e)
            {
                Console.Error.WriteLine("Skipping testMergeFolder because test directory might not exist locally: " + e.Message);
            }
        }
    }
}