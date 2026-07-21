#ifndef RICH_JSON_CONSTANTS_HPP
#define RICH_JSON_CONSTANTS_HPP

#include <nlohmann/json.hpp>
#include <regex>
#include <string>

namespace RichJson {

using json = nlohmann::json;

// Ported 1:1 from core/RichJsonConstants.java (signs must match the JS/Java
// ports exactly, since RichJson files are meant to be interchangeable across
// language ports).
class RichJsonConstants {
public:
    static inline const std::string COMMAND_PREFIX = "$";
    static inline const std::string COMMAND_SUFFIX = ":";
    static inline const std::regex COMMAND_WILDCARD{"^\\$.*:.*"};
    static inline const std::string COMMAND_DELIMITER = ",";
    static inline const std::string COMMAND_PATH_DELIMITER = "/";
    static inline const std::string COMMAND_PIPE_SIGN = "|";
    static inline const std::string COMMAND_REF = "$ref";
    static inline const std::string COMMAND_CLONE = "clone";
    static inline const std::string KEY_COMMAND_MEMBER = "__$_rich_json_key_commands_$__";
    // Internal sentinel set by RichJsonHelper::keepKeyCommands. In Java/JS,
    // key-command lists are reference types, so "treat as constant by
    // cloning" is enough to stop a *different* alias from having its commands
    // silently consumed. json values here are plain copies with no aliasing
    // to protect, so cloning alone is a no-op; this marker instead tells
    // RichJsonParser::executeKeyCommands to skip its normal auto-cleanup
    // (which would otherwise strip KEY_COMMAND_MEMBER once every listed
    // command has run) so the field remains inspectable afterward.
    static inline const std::string KEEP_KEY_COMMANDS_MARKER = "__$_rich_json_keep_key_commands_$__";

    static inline const std::regex ARRAY_WILDCARD{".*\\[.*\\].*"};
    static inline const std::string ARRAY_REPLACE_SUBSTRING = "][";
    static inline const std::string ARRAY_REPLACE_NEWSTRING = "]|[";

    static inline const std::string CONSTRUCTOR_SIGN = "=";
    static inline const std::string LATE_CONSTRUCTOR_SIGN = "==";
    static inline const std::string LATE_CONSTRUCTOR_MEMBER = "__#_rich_json_late_construct_#__";
    static inline const std::string EARLY_CONSTRUCTOR_MEMBER = "__#_rich_json_early_construct_#__";
    static inline const std::string INHERITANCE_SIGN = "::";

    static inline const std::regex INTERPOLATION_WILDCARD{".*\\{.*\\}.*"};
    static constexpr char INTERPOLATION_OPENING_SIGN = '{';
    static constexpr char INTERPOLATION_CLOSING_SIGN = '}';

    static bool isCommand(const std::string& name) {
        return name.rfind(COMMAND_PREFIX, 0) == 0 && name.find(COMMAND_SUFFIX) != std::string::npos;
    }
    static bool isConstructor(const std::string& name) {
        return name.find(CONSTRUCTOR_SIGN) != std::string::npos;
    }
    static bool isLateConstructor(const std::string& name) {
        return name.find(LATE_CONSTRUCTOR_SIGN) != std::string::npos;
    }
    static bool isInheritance(const std::string& name) {
        return name.find(INHERITANCE_SIGN) != std::string::npos;
    }
};

// A member is "RichJson-able" if it can meaningfully contain further RichJson
// expressions (string/array/object) - mirrors RichJsonParser.__isMemberRichJsonAble.
// Kept free-standing (not a RichJsonParser method) since it's a pure predicate
// on a json value and both RichJsonHelper and RichJsonParser need it.
inline bool isMemberRichJsonAble(const json& member) {
    return member.is_string() || member.is_array() || member.is_object();
}

} // namespace RichJson

#endif
