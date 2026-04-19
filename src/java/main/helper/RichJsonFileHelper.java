package helper;

import com.fasterxml.jackson.databind.ObjectMapper;
import core.RichJsonCommandHolder;
import other.RichJsonConfig;
import core.RichJsonParser;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

public class RichJsonFileHelper {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, Object> FILE_CACHE = new HashMap<>();

    /**
     * Liest ein Verzeichnis wie eine JSON-Datei und löst RichJson auf.
     */
    public static Map<String, Object> readDirectory(String pathStr, boolean executeLateApplies) {
        File folder = new File(pathStr);
        File[] entries = folder.listFiles();
        Map<String, Object> rv = new HashMap<>();

        if (entries == null) return rv;

        if (!executeLateApplies) {
            RichJsonCommandHolder.lateApplies.forEach(cmd -> RichJsonCommandHolder.setCommandEnabled(cmd, false));
        }

        for (File entry : entries) {
            String name = entry.getName();
            if (entry.isFile()) {
                String nameWithoutExtension = name.contains(".") ? name.substring(0, name.lastIndexOf('.')) : name;
                rv.put(nameWithoutExtension, readFile(entry.getPath(), true));
            } else if (entry.isDirectory()) {
                rv.put(name, readDirectory(entry.getPath(), true));
            }
        }

        if (!executeLateApplies) {
            RichJsonCommandHolder.lateApplies.forEach(cmd -> RichJsonCommandHolder.setCommandEnabled(cmd, true));
        }

        return rv;
    }

    /**
     * Liest eine JSON-Datei und führt den RichJsonParser darauf aus.
     */
    public static Object readFile(String pathStr, boolean executeLateApplies) {
        // 1. Cache Check
        if (RichJsonConfig.fileCacheEnabled && FILE_CACHE.containsKey(pathStr)) {
            return FILE_CACHE.get(pathStr);
        }

        if (RichJsonConfig.fileCacheEnabled) {
            FILE_CACHE.put(pathStr, new HashMap<String, Object>());
        }

        // 2. Late Applies Management
        if (!executeLateApplies) {
            RichJsonCommandHolder.lateApplies.forEach(cmd -> RichJsonCommandHolder.setCommandEnabled(cmd, false));
        }

        Object rv;
        try {
            Path path = Paths.get(pathStr);
            String content = Files.readString(path, StandardCharsets.UTF_8);

            rv = MAPPER.readValue(content, Object.class);

            RichJsonParser parser = new RichJsonParser();
            rv = parser.parse(rv, true);

        } catch (Exception e) {
            throw new RuntimeException("Error reading RichJson file: " + pathStr, e);
        }

        // 3. Reaktivierung
        if (!executeLateApplies) {
            RichJsonCommandHolder.lateApplies.forEach(cmd -> RichJsonCommandHolder.setCommandEnabled(cmd, true));
        }

        // 4. Cache Update
        if (RichJsonConfig.fileCacheEnabled) {
            Object cached = FILE_CACHE.get(pathStr);
            if (cached instanceof Map && rv instanceof Map) {
                RichJsonHelper.mergeIntoTarget((Map<String, Object>) cached, (Map<String, Object>) rv);
            } else {
                FILE_CACHE.put(pathStr, rv);
            }
        }

        return rv;
    }
}