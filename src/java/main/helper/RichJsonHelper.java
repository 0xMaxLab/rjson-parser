package helper;

import com.fasterxml.jackson.databind.ObjectMapper;
import core.RichJsonCache;
import core.RichJsonConstants;
import core.RichJsonParser;
import other.RichJsonConfig;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public class RichJsonHelper {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static Object parse(Object object) {
        if (RichJsonConfig.logEnabled) {
            System.out.println("RichJson is going to be applied...");
        }

        try {
            return new RichJsonParser().parse(object, true);
        } catch (Exception exception)  {
            if (RichJsonConfig.debugEnabled) {
                System.out.println(exception.getStackTrace());
            }
            return null;
        }
    }

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
        return isResolvedRecursive(parser, object, parser.cache.resolveAddress(object));
    }

    @SuppressWarnings("unchecked")
    private static boolean isResolvedRecursive(RichJsonParser parser, Object object, String address) {
        if (object == null) {
            return true;
        }

        if (parser.cache.stack.containsKey(address)) {
            return true;
        }
        parser.cache.stack.put(address, object);

        boolean isJsonObj = object instanceof Map;

        if (isJsonObj) {
            Map<String, Object> map = (Map<String, Object>) object;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER) ||
                    map.containsKey(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER)) {
                return false;
            }
        }

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
        if (!parser.__isMemberRichJsonAble(member)) {
            return true;
        }

        if (member instanceof String) {
            String str = (String) member;
            if (RichJsonConstants.COMMAND_WILDCARD.matcher(str).find() ||
                    RichJsonConstants.INTERPOLATION_WILDCARD.matcher(str).find()) {
                return false;
            }
        } else {
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
        var targetMap = (target instanceof Map)
                ? (Map<String, Object>) target
                : (Map<String, Object>) mapper.convertValue(target, Map.class);

        for (var other : others) {
            if (other == null) continue;

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
        cache.stack.put(cache.resolveAddress(other), other);
        cache.level++;

        var names = new ArrayList<>(other.keySet());
        for (var name : names) {
            var member = other.get(name);

            if (member != null && isJsonObject(member)) {
                var targetMember = target.get(name);

                if (isJsonObject(targetMember)) {
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
            } else if (force || !target.containsKey(name)) {
                target.put(name, member);
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
            return object;
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

        return true; // TODO other.RichJsonClassMapping.isMapped(object.getClass().getSimpleName());
    }

    /**
     * Holt ein Feld eines Objekts anhand eines Schlüssels (String).
     * Unterstützt Maps, Listen (falls der Key eine Zahl ist) und POJOs via Reflection/Jackson.
     */
    public static Object getFieldByKey(Object object, String key) {
        if (object == null || key == null) {
            return null;
        }

        if (object instanceof Map) {
            var map = (Map<?, ?>) object;
            return map.get(key);
        }

        if (object instanceof List) {
            var list = (List<?>) object;
            try {
                var index = Integer.parseInt(key);
                if (index >= 0 && index < list.size()) {
                    return list.get(index);
                }
            } catch (NumberFormatException e) {
                return null;
            }
        }

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
}