package core;

import java.util.regex.Pattern;

public class RichJsonConstants {
    public static final String COMMAND_PREFIX = "$";
    public static final String COMMAND_SUFFIX = ":";
    public static final Pattern COMMAND_WILDCARD = Pattern.compile("^\\$.*:.*");
    public static final String COMMAND_DELIMITER = ",";
    public static final String COMMAND_PATH_DELIMITER = "/";
    public static final String COMMAND_PIPE_SIGN = "|";
    public static final String COMMAND_REF = "$ref";
    public static final String COMMAND_CLONE = "clone";
    public static final String KEY_COMMAND_MEMBER = "__$_rich_json_key_commands_$__";

    public static final Pattern ARRAY_WILDCARD = Pattern.compile(".*\\[.*].*");
    public static final String ARRAY_REPLACE_SUBSTRING = "][";
    public static final String ARRAY_REPLACE_NEWSTRING = "]|[";

    public static final String CONSTRUCTOR_SIGN = "=";
    public static final String LATE_CONSTRUCTOR_SIGN = "==";
    public static final String LATE_CONSTRUCTOR_MEMBER = "__#_rich_json_late_construct_#__";
    public static final String EARLY_CONSTRUCTOR_MEMBER = "__#_rich_json_early_construct_#__";
    public static final String INHERITANCE_SIGN = "::";

    public static final Pattern INTERPOLATION_WILDCARD = Pattern.compile(".*\\{.*}.*");
    public static final char INTERPOLATION_OPENING_SIGN = '{';
    public static final char INTERPOLATION_CLOSING_SIGN = '}';

    public static boolean isCommand(String name) { return name.startsWith(COMMAND_PREFIX) && name.contains(COMMAND_SUFFIX); }
    public static boolean isConstructor(String name) { return name.contains(CONSTRUCTOR_SIGN); }
    public static boolean isLateConstructor(String name) { return name.contains(LATE_CONSTRUCTOR_SIGN); }
    public static boolean isInheritance(String name) { return name.contains(INHERITANCE_SIGN); }
}
