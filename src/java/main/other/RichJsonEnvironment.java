package other;

import core.RichJsonConstants;

import java.util.HashMap;
import java.util.Map;

/**
 * Verwaltet die globalen Umgebungsvariablen (Macros) für RichJson.
 */
public class RichJsonEnvironment {

    public static final Map<String, Object> env = new HashMap<>();

    /**
     * Fügt mehrere Konstanten zur Umgebung hinzu.
     * @param envs Eine Map mit Namen und Werten.
     */
    public static void addEnvironmentVariables(Map<String, Object> envs) {
        if (envs == null) return;

        for (Map.Entry<String, Object> entry : envs.entrySet()) {
            addEnvironmentVariable(entry.getKey(), entry.getValue());
        }
    }

    /**
     * Fügt eine einzelne Konstante zur Umgebung hinzu.
     * @param name Der Name der Variable.
     * @param value Der Wert der Variable.
     */
    public static void addEnvironmentVariable(String name, Object value) {
        if (RichJsonConstants.KEY_COMMAND_MEMBER.equals(name)) {
            return;
        }

        if (env.containsKey(name)) {
            throw new RuntimeException("RichJson has the macro '" + name + "' already defined");
        }

        env.put(name, value);
    }
}