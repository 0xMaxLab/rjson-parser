#ifndef RICH_JSON_CONSTANTS_HPP
#define RICH_JSON_CONSTANTS_HPP

#include <nlohmann/json.hpp>
#include <regex>
#include <string>

namespace RichJson {

using json = nlohmann::json;

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

inline bool isMemberRichJsonAble(const json& member) {
    return member.is_string() || member.is_array() || member.is_object();
}

}

#endif
