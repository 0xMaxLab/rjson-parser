import java.util.HashMap;
import java.util.Map;

public class RichJsonCache {
    public int level = 0;
    public String cloneAddress = null;
    public Map<String, String> inheritances = new HashMap<>();
    public Map<String, Object> stack = new HashMap<>();

    public String resolveAddress(Object obj) {
        if (obj == null) return "null";
        return String.valueOf(System.identityHashCode(obj));
    }
}