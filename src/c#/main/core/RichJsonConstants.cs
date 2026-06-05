using System;
using System.Text.RegularExpressions;

namespace main.core
{
    public static class RichJsonConstants
    {
        public const string COMMAND_PREFIX = "$";
        public const string COMMAND_SUFFIX = ":";
        public static readonly Regex COMMAND_WILDCARD = new Regex(@"^\$.*:.*", RegexOptions.Compiled);
        public const string COMMAND_DELIMITER = ",";
        public const string COMMAND_PATH_DELIMITER = "/";
        public const string COMMAND_PIPE_SIGN = "|";
        public const string COMMAND_REF = "$ref";
        public const string COMMAND_CLONE = "clone";
        public const string KEY_COMMAND_MEMBER = "__$_rich_json_key_commands_$__";

        public static readonly Regex ARRAY_WILDCARD = new Regex(@".*\[.*].*", RegexOptions.Compiled);
        public const string ARRAY_REPLACE_SUBSTRING = "][";
        public const string ARRAY_REPLACE_NEWSTRING = "]|[";

        public const string CONSTRUCTOR_SIGN = "=";
        public const string LATE_CONSTRUCTOR_SIGN = "==";
        public const string LATE_CONSTRUCTOR_MEMBER = "__#_rich_json_late_construct_#__";
        public const string EARLY_CONSTRUCTOR_MEMBER = "__#_rich_json_early_construct_#__";
        public const string INHERITANCE_SIGN = "::";

        public static readonly Regex INTERPOLATION_WILDCARD = new Regex(@".*\{.*}.*", RegexOptions.Compiled);
        public const char INTERPOLATION_OPENING_SIGN = '{';
        public const char INTERPOLATION_CLOSING_SIGN = '}';

        public static bool IsCommand(string name) { return name.StartsWith(COMMAND_PREFIX) && name.Contains(COMMAND_SUFFIX); }
        public static bool IsConstructor(string name) { return name.Contains(CONSTRUCTOR_SIGN); }
        public static bool IsLateConstructor(string name) { return name.Contains(LATE_CONSTRUCTOR_SIGN); }
        public static bool IsInheritance(string name) { return name.Contains(INHERITANCE_SIGN); }
    }
}