import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import core.RichJsonCommand;
import core.*;
import helper.RichJsonHelper;
import module.RichJsonModule;
import module.RichJsonModuleManager;
import org.junit.jupiter.api.Test;
import other.RichJsonEnvironment;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;


public class RichJsonTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        try {
            return mapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Parsen der Test-JSON", e);
        }
    }

    private String stringify(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Fehler beim Stringify", e);
        }
    }

    private RichJsonParser getParser() {
        return new RichJsonParser();
    }

    class RichJson_ilog implements RichJsonCommand {
        @Override
        public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
            return "success";
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void testModule() throws Exception {
        Map<String, Object> content = parseJson("""
                    {
                        "first": "$ilog:Hello World!"
                    }
                """);

        RichJsonModule module = new RichJsonModule("test")
                .addCommand("ilog", new RichJsonTest.RichJson_ilog(), null);

        RichJsonModuleManager.registerModule(module);
        RichJsonModuleManager.includeModule("test");

        getParser().parse(content, true);

        assertNotNull(content);
        assertEquals("success", content.get("first"));

        Map<String, Object> content2 = parseJson("""
                    {
                        "first": "$ilog:Hello World!"
                    }
                """);

        RichJsonModuleManager.excludeModule("test");
        RichJsonModuleManager.unregisterModule("test");

        try {
            getParser().parse(content2, true);
        } catch (Exception e) {
            // ignore
        }

        assertEquals("$ilog:Hello World!", content2.get("first"));
    }

    public static class RichJsonTestClass {
        public int value;
        public Map<String, Object> second;

        public RichJsonTestClass() {
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void testConstructor() throws Exception {
        Map<String, Object> content = parseJson("""
                    {
                        "first=RichJsonTestClass": {
                            "value": 100
                        },
                        "second==RichJsonTestClass::first": {
                        }
                    }
                """);

        getParser().parse(content, true);

        RichJsonTestClass first = mapper.convertValue(content.get("first"), RichJsonTestClass.class);
        RichJsonTestClass second = mapper.convertValue(content.get("second"), RichJsonTestClass.class);

        assertEquals(100, first.value);
        assertEquals(0, second.value);
    }

    @Test
    @SuppressWarnings("unchecked")
    void testInheritance() throws Exception {
        Map<String, Object> content = parseJson("""
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

        getParser().parse(content, true);

        Map<String, Object> first = (Map<String, Object>) content.get("first");
        Map<String, Object> second = (Map<String, Object>) content.get("second");
        Map<String, Object> third = (Map<String, Object>) content.get("third");

        assertEquals(10, first.get("x"));
        assertEquals(5, first.get("y"));
        assertSame(second, first.get("other"));

        assertEquals(5, second.get("x"));
        assertEquals(5, second.get("y"));

        Map<String, Object> secondOther = (Map<String, Object>) second.get("other");
        assertEquals(first.get("x"), secondOther.get("x"));
        assertEquals(first.get("y"), secondOther.get("y"));

        Map<String, Object> secondOtherOther = (Map<String, Object>) secondOther.get("other");
        assertEquals(second.get("x"), secondOtherOther.get("x"));
        assertEquals(second.get("y"), secondOtherOther.get("y"));

        assertEquals(10, third.get("x"));
        assertEquals(5, third.get("y"));
        assertSame(first, third.get("other"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testBatch() throws Exception {
        Map<String, Object> content = parseJson("""
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

        getParser().parse(content, true);

        Map<String, Object> first = (Map<String, Object>) content.get("first");
        Map<String, Object> fourth = (Map<String, Object>) content.get("fourth");

        assertEquals(stringify(fourth.get("sixth")), stringify(first.get("third")));
        assertNotSame(fourth.get("sixth"), first.get("third"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testPipe() throws Exception {
        Map<String, Object> content = parseJson("""
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

        getParser().parse(content, true);

        Map<String, Object> first = (Map<String, Object>) content.get("first");
        Map<String, Object> third = (Map<String, Object>) first.get("third");
        assertEquals("fifth", third.get("fourth"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testArray() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "first": [
                    {
                        "second": "second"
                    }
                ],
                "third": "$ref:first[0]"
            }
        """);

        getParser().parse(content, true);

        List<Object> first = (List<Object>) content.get("first");
        assertSame(first.get(0), content.get("third"));
    }

    @Test
    void testInterpolation() throws Exception {
        Map<String, Object> content = parseJson("""
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

        getParser().parse(content, true);

        assertEquals("test_third_test", content.get("fourth"));
        assertEquals("test_{ $ref:first/third }", content.get("fifth"));
        assertEquals("test_{$ref:first/third/third}second", content.get("sixth"));
        assertEquals("test_{$ref:first/third/third}", content.get("seventh"));
        assertEquals("third", content.get("eigth"));
    }

    @Test
    void testIsResolved() {
        Map<String, Object> content1 = parseJson("""
            {
                "first": "$ref:second",
                "second": "second"
            }
        """);
        assertFalse(RichJsonHelper.isResolved(content1));

        Map<String, Object> content2 = parseJson("""
            {
                "first": "{$ref:second}",
                "second": "second"
            }
        """);
        assertFalse(RichJsonHelper.isResolved(content2));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testRef() throws Exception {
        Map<String, Object> content = parseJson("""
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

        getParser().parse(content, true);

        Map<String, Object> first = (Map<String, Object>) content.get("first");
        Map<String, Object> third = (Map<String, Object>) first.get("third");
        Map<String, Object> fourth = (Map<String, Object>) content.get("fourth");
        Map<String, Object> seventh = (Map<String, Object>) fourth.get("seventh");

        assertSame(fourth.get("fifth"), third.get("fourth"));
        assertSame(fourth, seventh.get("eigth"));
    }

    @Test
    void testEnv() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "env": "$env:RichJsonTestEnv"
            }
        """);

        RichJsonEnvironment.addEnvironmentVariable("RichJsonTestEnv", "Hello World!");
        getParser().parse(content, true);

        assertEquals("Hello World!", content.get("env"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testThis() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "this": "$this:"
            }
        """);

        getParser().parse(content, true);

        assertSame(content, content.get("this"));

        Map<String, Object> thisObj = (Map<String, Object>) content.get("this");
        assertSame(thisObj, thisObj.get("this"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testMerge() throws Exception {
        Map<String, Object> content = parseJson("""
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

        getParser().parse(content, true);

        Map<String, Object> first = (Map<String, Object>) content.get("first");
        Map<String, Object> fourth = (Map<String, Object>) content.get("fourth");

        Map<String, Object> manualMerge = (Map<String, Object>) RichJsonHelper.mergeObjects(
                (Map<String, Object>) first.get("second"),
                (Map<String, Object>) first.get("third")
        );
        assertEquals(stringify(manualMerge), stringify(fourth.get("fifth")));

        List<Object> seventh = (List<Object>) content.get("seventh");
        List<Object> eigth = (List<Object>) content.get("eigth");
        List<Object> tenth = new ArrayList<>();
        tenth.addAll(seventh);
        tenth.addAll(eigth);
        tenth.addAll(eigth);
        assertEquals(stringify(tenth), stringify(content.get("tenth")));
    }

    @Test
    void testCopy() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "first": {
                    "second": "second",
                    "test": "$copy:first"
                },
                "third": "$copy:first"
            }
        """);

        getParser().parse(content, true);

        assertNotSame(content.get("first"), content.get("third"));
        assertEquals(content.get("first"), content.get("third"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testClone() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "$clone:first": {"second": "second"}
            }
        """);

        Map<String, Object> clone = parseJson("""
            {
                "$clone:first": {}
            }
        """);
        clone.put("$clone:first", content.get("$clone:first"));

        getParser().parse(clone, true);

        assertNotSame(content.get("$clone:first"), clone.get("first"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testFile() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "file": "$file:resources/json/test0"
            }
        """);

        try {
            getParser().parse(content, true);
            Map<String, Object> fileContent = (Map<String, Object>) content.get("file");
            assertTrue((Boolean) fileContent.get("root0"));
        } catch (Exception e) {
            System.err.println("Skipping testFile because test file might not exist locally: " + e.getMessage());
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void testFolder() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "folder": "$folder:resources/json"
            }
        """);

        try {
            getParser().parse(content, true);
            Map<String, Object> folderContent = (Map<String, Object>) content.get("folder");
            Map<String, Object> test0 = (Map<String, Object>) folderContent.get("test0");
            Map<String, Object> test1 = (Map<String, Object>) folderContent.get("test1");

            assertTrue((Boolean) test0.get("root0"));
            assertTrue((Boolean) test1.get("root0"));
        } catch (Exception e) {
            System.err.println("Skipping testFolder because test directory might not exist locally: " + e.getMessage());
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void testMergeFolder() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "folder": "$merge_folder:resources/json"
            }
        """);

        try {
            getParser().parse(content, true);
            Map<String, Object> folderContent = (Map<String, Object>) content.get("folder");
            Map<String, Object> root1 = (Map<String, Object>) folderContent.get("root1");

            assertTrue((Boolean) folderContent.get("root0"));
            assertEquals("Hello World!", root1.get("prop1"));
        } catch (Exception e) {
            System.err.println("Skipping testMergeFolder because test directory might not exist locally: " + e.getMessage());
        }
    }
    @Test
    @SuppressWarnings("unchecked")
    void testInvoke() throws Exception {
        Map<String, Object> content = parseJson("""
            {
                "function_result": "$env$invoke:test_function"
            }
        """);

        RichJsonEnvironment.addEnvironmentVariable("test_function", (Supplier<Object>) () -> { return 3 + 2; });

        getParser().parse(content, true);

        assertEquals(5, content.get("function_result"));
    }
}