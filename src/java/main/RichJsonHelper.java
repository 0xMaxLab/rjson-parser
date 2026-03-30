import java.util.*;
import java.util.regex.Pattern;

public class RichJsonHelper {

    // ==========================================
    // STRING & ARRAY UTILS
    // ==========================================

    public static String concatStrings(String... strings) {
        return String.join("", strings);
    }

    @SafeVarargs
    public static List<Object> concatArrays(List<Object>... arrays) {
        List<Object> result = new ArrayList<>();
        for (List<Object> array : arrays) {
            if (array != null) {
                result.addAll(array);
            }
        }
        return result;
    }

    public static boolean matchesWildcard(String string, String wildcard) {
        if (string == null || wildcard == null) return false;
        // Escaped alle Regex-Zeichen außer dem Sternchen (*)
        String escaped = wildcard.replaceAll("[.+?^${}()|\\[\\]\\\\]", "\\\\$0");
        String regexStr = "^" + escaped.replace("*", ".*") + "$";
        return string.matches(regexStr);
    }

    // ==========================================
    // OBJECT UTILS
    // ==========================================

    public static boolean isJsonObject(Object object) {
        // Da wir Jackson nutzen, sind JSON-Objekte immer Maps.
        return object instanceof Map;
    }

    public static Object getFieldByKey(Object object, String key) {
        if (object instanceof Map) {
            return ((Map<?, ?>) object).get(key);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public static List<String> getKeysSorted(Object object) {
        if (!(object instanceof Map)) return new ArrayList<>();
        List<String> keys = new ArrayList<>(((Map<String, Object>) object).keySet());
        // Sortierung Case-Insensitive (Basis-Sensitivität im JS)
        keys.sort(String.CASE_INSENSITIVE_ORDER);
        return keys;
    }

    // ==========================================
    // MERGE LOGIC
    // ==========================================

    /**
     * Entspricht mergeObjects und mergeObjectsWithoutRebind
     */
    @SafeVarargs
    public static Map<String, Object> mergeObjects(Map<String, Object>... objects) {
        return mergeIntoTarget(new HashMap<>(), objects);
    }

    /**
     * Entspricht mergeIntoTarget und mergeIntoWithoutRebind
     */
    @SafeVarargs
    public static Map<String, Object> mergeIntoTarget(Map<String, Object> target, Map<String, Object>... others) {
        for (Map<String, Object> other : others) {
            if (other == null) continue;

            RichJsonCache cache = new RichJsonCache();
            __mergeIntoTarget(cache, target, other, false);

            if (cache.level != 0) {
                System.err.println("RichJson mergeIntoTarget failed!");
            }
        }
        return target;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> __mergeIntoTarget(RichJsonCache cache, Map<String, Object> target, Map<String, Object> other, boolean force) {
        String address = cache.resolveAddress(other);
        cache.stack.put(address, other);
        cache.level++;

        for (Map.Entry<String, Object> entry : other.entrySet()) {
            String name = entry.getKey();
            Object member = entry.getValue();

            if (member != null && isJsonObject(member) && isJsonObject(target.get(name))) {
                if (!cache.stack.containsKey(cache.resolveAddress(member))) {
                    __mergeIntoTarget(cache, (Map<String, Object>) target.get(name), (Map<String, Object>) member, force);
                }
            } else if (force || !target.containsKey(name)) {
                target.put(name, member);
            }
        }

        cache.level--;
        return target;
    }

    // ==========================================
    // CLONE LOGIC
    // ==========================================

    /**
     * Klont Maps, Listen und Primitives tief (Deep Clone). Löst Zirkelreferenzen auf.
     */
    public static Object cloneObject(Object object) {
        RichJsonCache cache = new RichJsonCache();
        Object cloned = _cloneObject(cache, object);
        if (cache.level != 0) {
            System.err.println("RichJson cloneObject failed!");
        }
        return cloned;
    }

    @SuppressWarnings("unchecked")
    private static Object _cloneObject(RichJsonCache cache, Object object) {
        // Null oder Primitives (String, Integer, etc.) werden direkt zurückgegeben
        if (object == null || (!isJsonObject(object) && !(object instanceof List))) {
            return object;
        }

        String address = cache.resolveAddress(object);

        // Zirkelreferenz entdeckt! Gebe die bereits geklonte Referenz zurück
        if (cache.stack.containsKey(address)) {
            return cache.stack.get(address);
        }

        cache.level++;
        Object newObj;

        if (isJsonObject(object)) {
            Map<String, Object> sourceMap = (Map<String, Object>) object;
            Map<String, Object> targetMap = new HashMap<>();
            newObj = targetMap;

            // Sofort im Stack speichern für Kind-Knoten, die auf uns zurückzeigen könnten
            cache.stack.put(address, targetMap);

            for (Map.Entry<String, Object> entry : sourceMap.entrySet()) {
                targetMap.put(entry.getKey(), _cloneObject(cache, entry.getValue()));
            }
        } else {
            List<Object> sourceList = (List<Object>) object;
            List<Object> targetList = new ArrayList<>();
            newObj = targetList;

            cache.stack.put(address, targetList);

            for (Object item : sourceList) {
                targetList.add(_cloneObject(cache, item));
            }
        }

        cache.level--;
        return newObj;
    }
}