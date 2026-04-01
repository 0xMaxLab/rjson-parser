import helper.RichJsonHelper;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class RichJsonHelperTest {

    @Test
    @SuppressWarnings("unchecked")
    public void testMergeObjects() {
        // Setup obj3
        Map<String, Object> obj3 = new HashMap<>();
        obj3.put("y", 15);
        Map<String, Object> data3 = new HashMap<>();
        data3.put("name", "obj3");
        data3.put("size", 173);
        data3.put("age", 15);
        obj3.put("data", data3);

        // Setup obj2
        Map<String, Object> obj2 = new HashMap<>();
        obj2.put("x", 10);
        Map<String, Object> data2 = new HashMap<>();
        data2.put("age", 17);
        obj2.put("data", data2);
        obj2.put("other", obj3);

        // Setup obj1
        Map<String, Object> obj1 = new HashMap<>();
        obj1.put("x", 5);
        obj1.put("y", 5);
        Map<String, Object> data1 = new HashMap<>();
        data1.put("name", "obj1");
        obj1.put("data", data1);
        obj1.put("other", obj2);

        // Action 1
        Map<String, Object> res = (Map<String, Object>) RichJsonHelper.mergeObjects(obj1, obj2, obj3);

        // Assertions for Action 1
        assertEquals(5, res.get("x"));
        assertEquals(5, res.get("y"));
        assertEquals("obj1", ((Map<String, Object>) res.get("data")).get("name"));
        assertEquals(17, ((Map<String, Object>) res.get("data")).get("age"));
        assertEquals(173, ((Map<String, Object>) res.get("data")).get("size"));
        assertSame(obj2, res.get("other"));

        Map<String, Object> resOther = (Map<String, Object>) res.get("other");
        assertEquals(10, resOther.get("x"));
        assertEquals(15, resOther.get("y"));
        assertEquals("obj3", ((Map<String, Object>) resOther.get("data")).get("name"));
        assertEquals(17, ((Map<String, Object>) resOther.get("data")).get("age"));
        assertEquals(173, ((Map<String, Object>) resOther.get("data")).get("size"));
        assertSame(obj3, resOther.get("other"));

        // Action 2
        res = (Map<String, Object>) RichJsonHelper.mergeObjects(obj3, obj2, obj1);

        // Assertions for Action 2
        assertEquals(10, res.get("x"));
        assertEquals(15, res.get("y"));
        assertEquals("obj3", ((Map<String, Object>) res.get("data")).get("name"));
        assertEquals(15, ((Map<String, Object>) res.get("data")).get("age"));
        assertEquals(173, ((Map<String, Object>) res.get("data")).get("size"));
        assertSame(obj3, res.get("other"));

        resOther = (Map<String, Object>) res.get("other");
        assertEquals(10, resOther.get("x"));
        assertEquals(15, resOther.get("y"));
        assertEquals("obj3", ((Map<String, Object>) resOther.get("data")).get("name"));
        assertEquals(15, ((Map<String, Object>) resOther.get("data")).get("age"));
        assertEquals(173, ((Map<String, Object>) resOther.get("data")).get("size"));
        assertSame(obj3, resOther.get("other"));

        // Check unmodified originals
        assertEquals(10, obj2.get("x"));
        assertEquals(15, obj2.get("y"));
        assertEquals("obj3", ((Map<String, Object>) obj2.get("data")).get("name"));
        assertEquals(17, ((Map<String, Object>) obj2.get("data")).get("age"));
        assertEquals(173, ((Map<String, Object>) obj2.get("data")).get("size"));

        assertEquals(10, obj3.get("x"));
        assertEquals(15, obj3.get("y"));
        assertEquals("obj3", ((Map<String, Object>) obj3.get("data")).get("name"));
        assertEquals(15, ((Map<String, Object>) obj3.get("data")).get("age"));
        assertEquals(173, ((Map<String, Object>) obj3.get("data")).get("size"));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testCloneObject() {
        // Setup obj
        Map<String, Object> obj = new HashMap<>();
        obj.put("y", 15);
        Map<String, Object> data = new HashMap<>();
        data.put("name", "obj3");
        data.put("size", 173);
        data.put("age", 15);
        obj.put("data", data);
        List<Object> array = new ArrayList<>();
        obj.put("array", array);

        // Circular references
        obj.put("self", obj);
        array.add(obj);

        // Action
        Map<String, Object> res = (Map<String, Object>) RichJsonHelper.cloneObject(obj);

        // Assertions
        assertNotSame(obj, res);
        assertNotSame(obj.get("data"), res.get("data"));
        assertNotSame(obj.get("array"), res.get("array"));

        assertSame(res, res.get("self"));
        assertSame(res, ((List<Object>) res.get("array")).get(0));

        assertEquals(15, res.get("y"));
        assertEquals(15, ((Map<String, Object>) res.get("self")).get("y"));
        assertEquals("obj3", ((Map<String, Object>) res.get("data")).get("name"));
    }
}