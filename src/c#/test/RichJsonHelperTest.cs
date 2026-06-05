using System;
using System.Collections.Generic;
using NUnit.Framework;
using main.helper;

namespace test
{
    [TestFixture]
    public class RichJsonHelperTest
    {
        [Test]
        public void TestMergeObjects()
        {
            // Setup obj3
            var obj3 = new Dictionary<string, object>();
            obj3["y"] = 15;
            var data3 = new Dictionary<string, object>();
            data3["name"] = "obj3";
            data3["size"] = 173;
            data3["age"] = 15;
            obj3["data"] = data3;

            // Setup obj2
            var obj2 = new Dictionary<string, object>();
            obj2["x"] = 10;
            var data2 = new Dictionary<string, object>();
            data2["age"] = 17;
            obj2["data"] = data2;
            obj2["other"] = obj3;

            // Setup obj1
            var obj1 = new Dictionary<string, object>();
            obj1["x"] = 5;
            obj1["y"] = 5;
            var data1 = new Dictionary<string, object>();
            data1["name"] = "obj1";
            obj1["data"] = data1;
            obj1["other"] = obj2;

            // Action 1
            var res = (IDictionary<string, object>)RichJsonHelper.MergeObjects(obj1, obj2, obj3);

            // Assertions for Action 1
            Assert.That(res["x"], Is.EqualTo(5));
            Assert.That(res["y"], Is.EqualTo(5));
            Assert.That(((IDictionary<string, object>)res["data"])["name"], Is.EqualTo("obj1"));
            Assert.That(((IDictionary<string, object>)res["data"])["age"], Is.EqualTo(17));
            Assert.That(((IDictionary<string, object>)res["data"])["size"], Is.EqualTo(173));
            Assert.That(res["other"], Is.SameAs(obj2));

            var resOther = (IDictionary<string, object>)res["other"];
            Assert.That(resOther["x"], Is.EqualTo(10));
            Assert.That(resOther["y"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)resOther["data"])["name"], Is.EqualTo("obj3"));
            Assert.That(((IDictionary<string, object>)resOther["data"])["age"], Is.EqualTo(17));
            Assert.That(((IDictionary<string, object>)resOther["data"])["size"], Is.EqualTo(173));
            Assert.That(resOther["other"], Is.SameAs(obj3));

            // Action 2
            res = (IDictionary<string, object>)RichJsonHelper.MergeObjects(obj3, obj2, obj1);

            // Assertions for Action 2
            Assert.That(res["x"], Is.EqualTo(10));
            Assert.That(res["y"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)res["data"])["name"], Is.EqualTo("obj3"));
            Assert.That(((IDictionary<string, object>)res["data"])["age"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)res["data"])["size"], Is.EqualTo(173));
            Assert.That(res["other"], Is.SameAs(obj3));

            resOther = (IDictionary<string, object>)res["other"];
            Assert.That(resOther["x"], Is.EqualTo(10));
            Assert.That(resOther["y"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)resOther["data"])["name"], Is.EqualTo("obj3"));
            Assert.That(((IDictionary<string, object>)resOther["data"])["age"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)resOther["data"])["size"], Is.EqualTo(173));
            Assert.That(resOther["other"], Is.SameAs(obj3));

            // Check unmodified originals
            Assert.That(obj2["x"], Is.EqualTo(10));
            Assert.That(obj2["y"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)obj2["data"])["name"], Is.EqualTo("obj3"));
            Assert.That(((IDictionary<string, object>)obj2["data"])["age"], Is.EqualTo(17));
            Assert.That(((IDictionary<string, object>)obj2["data"])["size"], Is.EqualTo(173));

            Assert.That(obj3["x"], Is.EqualTo(10));
            Assert.That(obj3["y"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)obj3["data"])["name"], Is.EqualTo("obj3"));
            Assert.That(((IDictionary<string, object>)obj3["data"])["age"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)obj3["data"])["size"], Is.EqualTo(173));
        }

        [Test]
        public void TestCloneObject()
        {
            // Setup obj
            var obj = new Dictionary<string, object>();
            obj["y"] = 15;
            var data = new Dictionary<string, object>();
            data["name"] = "obj3";
            data["size"] = 173;
            data["age"] = 15;
            obj["data"] = data;
            var array = new List<object>();
            obj["array"] = array;

            // Circular references
            obj["self"] = obj;
            array.Add(obj);

            // Action
            var res = (IDictionary<string, object>)RichJsonHelper.CloneObject(obj);

            // Assertions
            Assert.That(res, Is.Not.SameAs(obj));
            Assert.That(res["data"], Is.Not.SameAs(obj["data"]));
            Assert.That(res["array"], Is.Not.SameAs(obj["array"]));

            Assert.That(res["self"], Is.SameAs(res));
            Assert.That(((List<object>)res["array"])[0], Is.SameAs(res));

            Assert.That(res["y"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)res["self"])["y"], Is.EqualTo(15));
            Assert.That(((IDictionary<string, object>)res["data"])["name"], Is.EqualTo("obj3"));
        }
    }
}