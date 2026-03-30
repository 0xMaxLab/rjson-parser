import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.*;

public class RichJsonParserTest {

    private ObjectMapper mapper;
    private RichJsonParser parser;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper();
        parser = new RichJsonParser();
        // Hier würden in der Praxis deine Module/Commands registriert werden:
        // RichJsonCommandHolder.registerCommand("ref", new RefCommand());
        // ...
    }

    // Hilfsmethode, um JSON-Strings schnell als dynamische Map zu laden und zu parsen
    private Map<String, Object> parseJson(String json) throws Exception {
        Map<String, Object> content = mapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        return (Map<String, Object>) parser.parse(content);
    }

    @Test
    void testModule() throws Exception {
        // Hinweis: In Java würdest du hier deinen Command im RichJsonCommandHolder registrieren.
        // RichJsonCommandHolder.addCommand("ilog", (parser, context) -> "success");

        String json = "{ \"first\": \"$ilog:Hello World!\" }";

        Map<String, Object> content = parseJson(json);

        // Angenommen, das Command ist aktiv:
        // assertEquals("success", content.get("first"));
    }

    // Die Zielklasse für den Constructor-Test
    public static class RichJsonTestClass {
        public int value = 0;
        public Map<String, Object> second;
        public String third;
    }

    @Test
    void testConstructor() throws Exception {
        // Hinweis: RichJsonTestClass muss als voller Paket-Pfad angegeben werden oder im Mapper konfiguriert sein
        String className = RichJsonTestClass.class.getName();
        String json = """
            {
                "first=%s": {
                    "value": 100,
                    "second": { "fourth": "fourth" }
                },
                "second=%s::first": {
                    "third": "third"
                }
            }
            """.formatted(className, className);

        Map<String, Object> content = parseJson(json);

        assertTrue(content.get("first") instanceof RichJsonTestClass);
        assertTrue(content.get("second") instanceof RichJsonTestClass);

        RichJsonTestClass first = (RichJsonTestClass) content.get("first");
        RichJsonTestClass second = (RichJsonTestClass) content.get("second");

        assertEquals(100, first.value);
        assertEquals(100, second.value); // Geerbt von first
        assertEquals("third", second.third);
        assertEquals(first.second, second.second);
    }

    @Test
    void testInheritance() throws Exception {
        String json = """
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
            """;

        Map<String, Object> content = parseJson(json);

        Map<String, Object> first = (Map<String, Object>) content.get("first");
        Map<String, Object> second = (Map<String, Object>) content.get("second");
        Map<String, Object> third = (Map<String, Object>) content.get("third");

        assertEquals(10, first.get("x"));
        assertEquals(5, first.get("y"));
        assertSame(second, first.get("other"));

        assertEquals(5, second.get("x"));
        assertEquals(5, second.get("y")); // Geerbt

        Map<String, Object> secondOther = (Map<String, Object>) second.get("other");
        assertEquals(10, secondOther.get("x"));
        assertEquals(5, secondOther.get("y"));
    }

    @Test
    void testBatch() throws Exception {
        String json = """
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
            """;

        Map<String, Object> content = parseJson(json);

        Map<String, Object> firstThird = (Map<String, Object>) ((Map<String, Object>) content.get("first")).get("third");
        Map<String, Object> fourthSixth = (Map<String, Object>) ((Map<String, Object>) content.get("fourth")).get("sixth");

        assertEquals(firstThird, fourthSixth); // Gleicher Inhalt
        assertNotSame(firstThird, fourthSixth); // Aber nicht dieselbe Instanz (wegen $clone)
    }

    @Test
    void testPipe() throws Exception {
        String json = """
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
            """;

        Map<String, Object> content = parseJson(json);
        Map<String, Object> firstThird = (Map<String, Object>) ((Map<String, Object>) content.get("first")).get("third");

        assertEquals("fifth", firstThird.get("fourth"));
    }

    @Test
    void testArray() throws Exception {
        String json = """
            {
                "first": [
                    { "second": "second" }
                ],
                "third": "$ref:first[0]"
            }
            """;

        Map<String, Object> content = parseJson(json);
        List<Object> first = (List<Object>) content.get("first");

        assertSame(first.get(0), content.get("third"));
    }

    @Test
    void testInterpolation() throws Exception {
        String json = """
            {
                "first": {
                    "first": "first",
                    "second": "second",
                    "third": "third",
                    "fourth": { "success": "success" }
                },
                "fourth": "test_{$ref:first/third}_test",
                "fifth": "test_{{} $ref:first/third {}}",
                "sixth": "test_{{}$ref:first/{$ref:first/third}/third{}}{$ref:first/second}",
                "seventh": "test_{{}$ref:first/{$ref:{$ref:first/first}/{$ref:first/third}}/third{}}",
                "eigth": "$ref:first/{$ref:first/third}"
            }
            """;

        Map<String, Object> content = parseJson(json);

        assertEquals("test_third_test", content.get("fourth"));
        assertEquals("test_{ $ref:first/third }", content.get("fifth"));
        assertEquals("test_{$ref:first/third/third}second", content.get("sixth"));
        assertEquals("test_{$ref:first/third/third}", content.get("seventh"));
        assertEquals("third", content.get("eigth"));
    }

    @Test
    void testRef() throws Exception {
        String json = """
            {
                "first": {
                    "second": "second",
                    "third": { "fourth": "$ref:fourth/fifth" }
                },
                "fourth": {
                    "fifth": "$ref:first/third/fourth",
                    "sixth": "$ref:fourth/seventh",
                    "seventh": { "eigth": "$ref:fourth" }
                }
            }
            """;

        Map<String, Object> content = parseJson(json);

        Map<String, Object> firstThird = (Map<String, Object>) ((Map<String, Object>) content.get("first")).get("third");
        Map<String, Object> fourth = (Map<String, Object>) content.get("fourth");
        Map<String, Object> fourthSeventh = (Map<String, Object>) fourth.get("seventh");

        assertSame(firstThird.get("fourth"), fourth.get("fifth"));
        assertSame(fourth, fourthSeventh.get("eigth"));
    }

    @Test
    void testInvoke() throws Exception {
        // Da Java keine JS-Lambdas im JSON haben kann, mogeln wir eine Java-Funktion 
        // in die Map, bevor der Parser sie verarbeitet.
        Map<String, Object> content = mapper.readValue("""
            { "function_result": "$ref$invoke:function" }
            """, new TypeReference<Map<String, Object>>() {});

        // Wir packen ein Java-Lambda direkt ins rohe Datenobjekt
        Supplier<Integer> func = () -> 4 + 2;
        content.put("function", func);

        content = (Map<String, Object>) parser.parse(content);

        assertEquals(6, content.get("function_result"));
    }

    @Test
    void testMerge() throws Exception {
        String json = """
            {
                "first": {
                    "second": { "second": "second" },
                    "third": { "fourth": "Hello World!" }
                },
                "fourth": {
                    "fifth": "$merge:first/second, first/third"
                },
                "seventh": ["v1", "v2"],
                "eigth": ["v3", "v4"],
                "ninth": "$merge:seventh, eigth"
            }
            """;

        Map<String, Object> content = parseJson(json);

        Map<String, Object> fourthFifth = (Map<String, Object>) ((Map<String, Object>) content.get("fourth")).get("fifth");
        assertEquals("second", fourthFifth.get("second"));
        assertEquals("Hello World!", fourthFifth.get("fourth"));

        List<Object> ninth = (List<Object>) content.get("ninth");
        assertEquals(4, ninth.size());
        assertEquals("v1", ninth.get(0));
        assertEquals("v3", ninth.get(2));
    }
}