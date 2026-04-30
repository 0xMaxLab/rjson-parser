package other;

import helper.RichJsonLogger;

import java.util.HashMap;
import java.util.Map;

public class RichJsonClassMapping {
    private static final Map<String, Class<?>> RICH_JSON_CLASS_MAPPING = new HashMap<>();

    /**
     * Adds the given class mappings.
     * * @param classMappings A map containing the class names as keys and the class types as values.
     */
    public static void addClassMappings(Map<String, Class<?>> classMappings) {
        for (Map.Entry<String, Class<?>> entry : classMappings.entrySet()) {
            addClassMapping(entry.getKey(), entry.getValue());
        }
    }

    /**
     * Adds the given class to the mapping table.
     * * @param name The name to associate with the class type.
     * @param classType The class type to map.
     * @throws IllegalArgumentException if the mapping name already exists.
     */
    public static void addClassMapping(String name, Class<?> classType) {
        if (RICH_JSON_CLASS_MAPPING.containsKey(name)) {
            RichJsonLogger.logger.warn("has the class '" + name + "' already defined");
        } else {
            RICH_JSON_CLASS_MAPPING.put(name, classType);
        }
    }

    /**
     * Retrieves the mapped class by its name.
     * * @param name The name of the class to retrieve.
     * @return The mapped Class<?> object.
     * @throws IllegalArgumentException if the class name is not found in the mapping.
     */
    public static Class<?> __mapClassByName(String name) {
        if (!RICH_JSON_CLASS_MAPPING.containsKey(name)) {
            throw new IllegalArgumentException("RichJSON could not find the class called '" + name + "'.\nMake sure its defined in RichJsonClassMapping.");
        }
        return RICH_JSON_CLASS_MAPPING.get(name);
    }
}