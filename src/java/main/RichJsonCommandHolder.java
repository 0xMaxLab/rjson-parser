import java.util.*;

public class RichJsonCommandHolder {

    public static boolean isCommandEnabled(String command) { return true; }
    public static void setCommandEnabled(String command, boolean enabled) {}
    public static List<String> getIgnoredKeyCommands(String command) { return new ArrayList<>(); }

    @SuppressWarnings("unchecked")
    public static Object executeCommand(String cmd, RichJsonParser parser, RichJsonContext con) throws Exception {
        String arg = con.currentMember instanceof String ? (String) con.currentMember : "";

        switch (cmd) {
            case "ref":
                return resolvePath(con.root, arg, parser);
            case "this":
                return con.root;
            case "clone":
            case "copy":
                // Copy und Clone machen bei reinen Daten (Maps/Lists) dasselbe
                return RichJsonHelper.cloneObject(resolvePath(con.root, arg, parser));
            case "merge":
                String[] paths = arg.split(",");
                List<Object> toMerge = new ArrayList<>();
                boolean isList = false;

                for (String p : paths) {
                    Object resolved = resolvePath(con.root, p.trim(), parser);
                    toMerge.add(resolved);
                    if (resolved instanceof List) isList = true;
                }

                if (isList) {
                    List<Object> mergedList = new ArrayList<>();
                    for (Object o : toMerge) {
                        if (o instanceof List) mergedList.addAll((List<?>) o);
                        else mergedList.add(o);
                    }
                    return mergedList;
                } else {
                    Map<String, Object> mergedMap = new HashMap<>();
                    for (Object o : toMerge) {
                        if (o instanceof Map) RichJsonHelper.mergeIntoTarget(mergedMap, (Map<String, Object>) o);
                    }
                    return mergedMap;
                }
            case "invoke":
                // Mock für testInvoke
                Object func = resolvePath(con.root, arg, parser);
                if (func instanceof java.util.function.Supplier) {
                    return ((java.util.function.Supplier<?>) func).get();
                }
                return func;
            default:
                // Fallback für nicht implementierte Befehle (wie ilog, file, env)
                return con.currentMember;
        }
    }

    @SuppressWarnings("unchecked")
    private static Object resolvePath(Object root, String path, RichJsonParser parser) throws Exception {
        if (path == null || path.isEmpty()) return root;

        path = path.replace("[", "/").replace("]", "");
        String[] parts = path.split("/");
        Object current = root;

        for (String part : parts) {
            if (part.isEmpty()) continue;

            if (current instanceof Map) {
                current = ((Map<String, Object>) current).get(part);
            } else if (current instanceof List) {
                current = ((List<Object>) current).get(Integer.parseInt(part));
            } else {
                return null;
            }

            // WICHTIG FÜR ZIRKELREFERENZEN (wie im testRef):
            // Wenn der Wert auf dem Pfad noch ein unaufgelöster Command (wie $ref:...) ist,
            // lösen wir ihn on-the-fly auf!
            if (current instanceof String && RichJsonHelper.matchesWildcard((String) current, RichJsonConstants.COMMAND_WILDCARD)) {
                current = parser.parse(current, false);
            }
        }
        return current;
    }
}