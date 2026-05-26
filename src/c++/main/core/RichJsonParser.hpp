#ifndef RICH_JSON_PARSER_HPP
#define RICH_JSON_PARSER_HPP

#include <string>
#include <vector>
#include <unordered_map>
#include <any>
#include <memory>
#include <regex>
#include <iostream>
#include <sstream>
#include <algorithm>
#include <cstdint>
#include <stdexcept>

class RichJsonLogger {
public:
    std::string label;
    RichJsonLogger(std::string l) : label(l) {}
    void info(std::string m) { std::cout << "[INFO] " << label << " " << m << "\n"; }
    void debug(std::string m) { std::cout << "[DEBUG] " << label << " " << m << "\n"; }
    void error(std::string m) { std::cerr << "[ERROR] " << label << " " << m << "\n"; }
    void groupStart() {}
    void groupEnd() {}
    void groupEndAll() {}
    void timeStart() {}
    void timeEnd() {}
};

struct Dynamic;
using DynamicMap = std::unordered_map<std::string, Dynamic>;
using DynamicList = std::vector<Dynamic>;

struct Dynamic {
    std::any value;

    bool isMap() const { return value.type() == typeid(DynamicMap); }
    bool isList() const { return value.type() == typeid(DynamicList); }
    bool isString() const { return value.type() == typeid(std::string); }

    DynamicMap& asMap() { return std::any_cast<DynamicMap&>(value); }
    const DynamicMap& asMap() const { return std::any_cast<const DynamicMap&>(value); }
    DynamicList& asList() { return std::any_cast<DynamicList&>(value); }
    const DynamicList& asList() const { return std::any_cast<const DynamicList&>(value); }
    std::string& asString() { return std::any_cast<std::string&>(value); }
    const std::string& asString() const { return std::any_cast<const std::string&>(value); }
};

class RichJsonCache {
public:
    int level = 0;
    std::unordered_map<std::string, Dynamic> stack;
    std::unordered_map<std::string, std::string> inheritances;
    std::string cloneAddress = "";

    std::string resolveAddress(const Dynamic& obj) {
        return std::to_string(reinterpret_cast<uintptr_t>(&obj.value));
    }
};

class RichJsonContext {
public:
    Dynamic root;
    Dynamic current;
    std::string currentName;
    Dynamic currentMember;
    std::string currentAddress;
    std::string currentCommand;
    std::vector<std::string> currentPath;
};

class RichJsonConstants {
public:
    static inline std::string COMMAND_PATH_DELIMITER = "/";
    static inline std::string COMMAND_PREFIX = "$";
    static inline std::string COMMAND_SUFFIX = ":";
    static inline std::string INHERITANCE_SIGN = "<";
    static inline std::string CONSTRUCTOR_SIGN = "@";
    static inline std::string LATE_CONSTRUCTOR_SIGN = "~";
    static inline std::string COMMAND_PIPE_SIGN = "|";
    static inline std::string KEY_COMMAND_MEMBER = "__kcmds__";
    static inline std::string LATE_CONSTRUCTOR_MEMBER = "__late_ctr__";
    static inline std::string COMMAND_CLONE = "clone";
    static inline std::string COMMAND_REF = "ref";
    static inline std::string ARRAY_REPLACE_SUBSTRING = "[]";
    static inline std::string ARRAY_REPLACE_NEWSTRING = "";
    static inline char INTERPOLATION_OPENING_SIGN = '{';
    static inline char INTERPOLATION_CLOSING_SIGN = '}';
    static inline std::regex INTERPOLATION_WILDCARD{"\\{.*\\}"};
    static inline std::regex COMMAND_WILDCARD{"^\\$.*:"};
    static inline std::regex ARRAY_WIRichJsonConstantsLDCARD{"\\[.*\\]"};

    static bool isCommand(const std::string& n) { return n.rfind(COMMAND_PREFIX, 0) == 0; }
    static bool isConstructor(const std::string& n) { return n.find(CONSTRUCTOR_SIGN) != std::string::npos; }
    static bool isInheritance(const std::string& n) { return n.find(INHERITANCE_SIGN) != std::string::npos; }
    static bool isLateConstructor(const std::string& n) { return n.find(LATE_CONSTRUCTOR_SIGN) != std::string::npos; }
};

class RichJsonConfig {
public:
    static inline bool stringInterpolationsEnabled = true;
    static inline bool lateConstructorEnabled = true;
};

class RichJsonClassMapping {
public:
    static DynamicMap createInstance(const std::string& className) {
        return DynamicMap{};
    }
};

class RichJsonParser;
class RichJsonCommandHolder {
public:
    static inline RichJsonCommandHolder INSTANCE;
    std::unordered_map<std::string, std::vector<std::string>> kcmdIgnored;
    static bool isCommandEnabled(const std::string& cmd) { return true; }
    static void setCommandEnabled(const std::string& cmd, bool state) {}
    static Dynamic executeCommand(const std::string& cmd, RichJsonParser* parser, RichJsonContext& con) { return con.currentMember; }
};

class RichJsonParser {
private:
    static inline int NEXT_ID = 0;
    int id;
    std::string label;

    struct InterpolationData {
        std::stringstream rv;
        bool isParsed = true;
    };

    struct InterpolationResult {
        std::string result;
        bool isParsed;
    };

public:
    RichJsonLogger logger;
    RichJsonCache cache;
    RichJsonContext con;

    RichJsonParser();
    Dynamic parse(Dynamic current, bool isRoot);

private:
    void __preprocess_kcommands_constructors_inheritances();
    Dynamic __parseRichJsonInMember();
    bool __isMemberRichJsonAble(const Dynamic& member);
    InterpolationResult __parseInterpolations();
    std::vector<std::string> __getIgnoresForKeyCommands();
    Dynamic __executeRichJsonCommandIfContainedInMember();
    Dynamic __tryRichJsonCommand();
    bool __isRichJsonCommandEnabled(const std::string& command);
    void __executeClone();
    void __callConstructor();
    void __resolveInheritances();
    void __resetCloneIfPossible(const std::string& address);
    bool __isCloneApplying();
    Dynamic __executeKeyCommands();
    Dynamic __tryRichJsonKeyCommand();
    
    std::string joinPath(const std::vector<std::string>& path, const std::string& delimiter) {
        std::string s;
        for (size_t i = 0; i < path.size(); ++i) {
            s += path[i];
            if (i < path.size() - 1) s += delimiter;
        }
        return s;
    }
};

#endif