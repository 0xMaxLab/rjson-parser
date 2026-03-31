package helper;

import com.fasterxml.jackson.databind.ObjectMapper;
import core.RichJsonCache;
import core.RichJsonConstants;
import core.RichJsonParser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public class RichJsonHelper {

    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Ensures that key commands within a JSON object are treated as constants by cloning them.
     * This prevents modifications during the parsing process (like removing processed commands)
     * from affecting the original data source.
     *
     * @param jsonObject The map containing potential RichJson metadata.
     * @return The modified map with a cloned command list.
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> keepKeyCommands(Map<String, Object> jsonObject) {
        if (jsonObject == null) {
            return null;
        }

        if (jsonObject.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER)) {
            Object commands = jsonObject.get(RichJsonConstants.KEY_COMMAND_MEMBER);

            // Create a deep copy of the command list to isolate it.
            Object clonedCommands = RichJsonHelper.cloneObject(commands);

            jsonObject.put(RichJsonConstants.KEY_COMMAND_MEMBER, clonedCommands);
        }

        return jsonObject;
    }

    /**
     * Prüft, ob das gegebene Objekt noch ungelöste RichJson-Ausdrücke enthält.
     */
    public static boolean isResolved(Object object) {
        RichJsonParser parser = new RichJsonParser();
        // Nutzt die resolveAddress Logik des Caches für das Root-Objekt
        return isResolvedRecursive(parser, object, parser.cache.resolveAddress(object));
    }

    @SuppressWarnings("unchecked")
    private static boolean isResolvedRecursive(RichJsonParser parser, Object object, String address) {
        // undefined/null gilt als aufgelöst
        if (object == null) {
            return true;
        }

        // Zirkuläre Referenzen via Cache-Stack abfangen
        if (parser.cache.stack.containsKey(address)) {
            return true;
        }
        parser.cache.stack.put(address, object);

        boolean isJsonObj = object instanceof Map;

        // 1. Check auf Key-Commands oder Late-Constructors im Objekt
        if (isJsonObj) {
            Map<String, Object> map = (Map<String, Object>) object;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER) ||
                    map.containsKey(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER)) {
                return false;
            }
        }

        // 2. Iteration über Member (Map-Values oder List-Elemente)
        if (isJsonObj) {
            Map<String, Object> map = (Map<String, Object>) object;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (!checkMember(parser, entry.getValue(), entry.getKey(), address)) {
                    return false;
                }
            }
        } else if (object instanceof List) {
            List<Object> list = (List<Object>) object;
            for (int i = 0; i < list.size(); i++) {
                if (!checkMember(parser, list.get(i), String.valueOf(i), address)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Hilfsmethode zur Validierung eines einzelnen Members.
     */
    private static boolean checkMember(RichJsonParser parser, Object member, String keyOrIndex, String parentAddress) {
        // Nur Strings, Listen und Maps können RichJson enthalten
        if (!parser.__isMemberRichJsonAble(member)) {
            return true;
        }

        if (member instanceof String) {
            String str = (String) member;
            // Check auf Command-Wildcards oder Interpolationen
            if (RichJsonHelper.matchesWildcard(str, RichJsonConstants.COMMAND_WILDCARD) ||
                    RichJsonHelper.matchesWildcard(str, RichJsonConstants.INTERPOLATION_WILDCARD)) {
                return false;
            }
        } else {
            // Rekursiver Check für verschachtelte Strukturen
            String memberAddress = parser.cache.resolveAddress(member);
            if (!isResolvedRecursive(parser, member, memberAddress)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Erzeugt ein neues Objekt aus dem Merge mehrerer Quellen.
     * Nutzt intern Maps für die Verarbeitung.
     */
    public static Object mergeObjects(Object... objects) {
        return mergeIntoTarget(new HashMap<String, Object>(), objects);
    }

    /**
     * Mergt diverse Objekte (Maps oder POJOs) in ein Target.
     */
    @SuppressWarnings("unchecked")
    public static Object mergeIntoTarget(Object target, Object... others) {
        // Falls das Target ein POJO ist, konvertieren wir es in eine Map,
        // um die Felder dynamisch erweitern zu können.
        var targetMap = (target instanceof Map)
                ? (Map<String, Object>) target
                : (Map<String, Object>) mapper.convertValue(target, Map.class);

        for (var other : others) {
            if (other == null) continue;

            // Konvertiere 'other' ebenfalls in eine Map, falls es ein POJO ist
            var otherMap = (other instanceof Map)
                    ? (Map<String, Object>) other
                    : (Map<String, Object>) mapper.convertValue(other, Map.class);

            var cache = new RichJsonCache();
            __mergeIntoTarget(cache, targetMap, otherMap, false);

            if (cache.level != 0) {
                System.err.println("RichJson mergeIntoTarget failed!");
            }
        }

        return targetMap;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> __mergeIntoTarget(RichJsonCache cache, Map<String, Object> target, Map<String, Object> other, boolean force) {
        // Nutzt System.identityHashCode für die Cache-Adresse bei echten Objekten
        cache.stack.put(cache.resolveAddress(other), other);
        cache.level++;

        var names = new ArrayList<>(other.keySet());
        for (var name : names) {
            var member = other.get(name);

            // Logik für rekursives Mergen
            if (member != null && isJsonObject(member)) {
                var targetMember = target.get(name);

                if (isJsonObject(targetMember)) {
                    // Falls beide JSON-Objekte sind, tiefer gehen
                    if (!cache.stack.containsKey(cache.resolveAddress(member))) {
                        var subTargetMap = (targetMember instanceof Map)
                                ? (Map<String, Object>) targetMember
                                : (Map<String, Object>) mapper.convertValue(targetMember, Map.class);

                        __mergeIntoTarget(cache, subTargetMap, (Map<String, Object>) member, force);
                        target.put(name, subTargetMap);
                    }
                } else if (force || targetMember == null) {
                    target.put(name, member);
                }
            } else {
                // Einfache Typen oder Arrays
                if (force || !target.containsKey(name)) {
                    target.put(name, member);
                }
            }
        }

        cache.level--;
        return target;
    }

    /**
     * Klont ein beliebiges Objekt oder eine Liste.
     */
    @SuppressWarnings("unchecked")
    public static Object cloneObject(Object object) {
        if (object == null) return null;

        var cache = new RichJsonCache();
        Object rootClone;

        if (object instanceof List) {
            rootClone = new ArrayList<>();
        } else if (isJsonObject(object)) {
            rootClone = new HashMap<String, Object>();
        } else {
            return object; // Primitive oder unbekannte Typen
        }

        cache.stack.put(cache.resolveAddress(object), rootClone);
        var result = _cloneObject(cache, object, rootClone);

        if (cache.level != 0) {
            System.err.println("RichJson cloneObject failed!");
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private static Object _cloneObject(RichJsonCache cache, Object object, Object target) {
        cache.level++;

        if (object instanceof Map || (isJsonObject(object) && !(object instanceof List))) {
            var sourceMap = (object instanceof Map)
                    ? (Map<String, Object>) object
                    : (Map<String, Object>) mapper.convertValue(object, Map.class);
            var targetMap = (Map<String, Object>) target;

            for (var entry : sourceMap.entrySet()) {
                var name = entry.getKey();
                var member = entry.getValue();
                processCloneMember(cache, targetMap, name, member);
            }
        } else if (object instanceof List) {
            var sourceList = (List<Object>) object;
            var targetList = (List<Object>) target;

            for (var member : sourceList) {
                if (isJsonObject(member) || member instanceof List) {
                    var addr = cache.resolveAddress(member);
                    if (!cache.stack.containsKey(addr)) {
                        var newObj = (member instanceof List) ? new ArrayList<>() : new HashMap<String, Object>();
                        cache.stack.put(addr, newObj);
                        targetList.add(_cloneObject(cache, member, newObj));
                    } else {
                        targetList.add(cache.stack.get(addr));
                    }
                } else {
                    targetList.add(member);
                }
            }
        }

        cache.level--;
        return target;
    }

    @SuppressWarnings("unchecked")
    private static void processCloneMember(RichJsonCache cache, Map<String, Object> targetMap, String name, Object member) {
        if (isJsonObject(member) || member instanceof List) {
            var addr = cache.resolveAddress(member);
            if (!cache.stack.containsKey(addr)) {
                var newObj = (member instanceof List) ? new ArrayList<>() : new HashMap<String, Object>();
                cache.stack.put(addr, newObj);
                targetMap.put(name, _cloneObject(cache, member, newObj));
            } else {
                targetMap.put(name, cache.stack.get(addr));
            }
        } else {
            targetMap.put(name, member);
        }
    }

    public static boolean isJsonObject(Object object) {
        if (object == null) return false;
        if (object instanceof Map) return true;
        if (object instanceof List || object instanceof String || object instanceof Number || object instanceof Boolean)
            return false;

        // Check gegen dein Mapping-System
        return true; // TODO other.RichJsonClassMapping.isMapped(object.getClass().getSimpleName());
    }

    /**
     * Konkateniert mehrere Objekte zu einem String.
     *
     * @param strings Variable Anzahl an Objekten (meist Strings)
     * @return Der zusammengefügte String
     */
    public static String concatStrings(Object... strings) {
        var rv = new StringBuilder();
        for (var str : strings) {
            if (str != null) {
                rv.append(str);
            }
        }
        return rv.toString();
    }

    /**
     * Konkateniert mehrere Listen zu einer neuen Liste.
     *
     * @param arrays Variable Anzahl an Listen
     * @return Eine neue Liste, die alle Elemente enthält
     */
    @SafeVarargs
    public static List<Object> concatArrays(List<Object>... arrays) {
        var rv = new ArrayList<Object>();
        for (var array : arrays) {
            if (array != null) {
                rv.addAll(array);
            }
        }
        return rv;
    }

    /**
     * Holt ein Feld eines Objekts anhand eines Schlüssels (String).
     * Unterstützt Maps, Listen (falls der Key eine Zahl ist) und POJOs via Reflection/Jackson.
     */
    public static Object getFieldByKey(Object object, String key) {
        if (object == null || key == null) {
            return null;
        }

        // Fall 1: Das Objekt ist eine Map
        if (object instanceof Map) {
            var map = (Map<?, ?>) object;
            return map.get(key);
        }

        // Fall 2: Das Objekt ist eine Liste (Key muss ein Index sein, z.B. "0")
        if (object instanceof List) {
            var list = (List<?>) object;
            try {
                var index = Integer.parseInt(key);
                if (index >= 0 && index < list.size()) {
                    return list.get(index);
                }
            } catch (NumberFormatException e) {
                // Key ist kein gültiger Integer-Index für eine Liste
                return null;
            }
        }

        // Fall 3: Das Objekt ist ein POJO
        // Wir nutzen den mapper, um das Feld zu extrahieren, falls es gemappt ist
        if (isJsonObject(object)) {
            try {
                var map = (Map<String, Object>) mapper.convertValue(object, Map.class);
                return map.get(key);
            } catch (Exception e) {
                return null;
            }
        }

        return null;
    }

    public static List<String> getKeysSorted(Object object) {
        if (object instanceof Map) {
            var keys = new ArrayList<>(((Map<String, Object>) object).keySet());
            keys.sort(String::compareToIgnoreCase);
            return keys;
        }
        return new ArrayList<>();
    }

    public static boolean matchesWildcard(String text, String wildcard) {
        if (text == null || wildcard == null) return false;
        var regex = Pattern.quote(wildcard).replace("*", "\\E.*\\Q").replace("?", "\\E.\\Q");
        return Pattern.compile("^" + regex + "$").matcher(text).matches();
    }
}