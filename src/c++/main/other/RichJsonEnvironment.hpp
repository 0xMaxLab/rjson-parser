#ifndef RICH_JSON_ENVIRONMENT_HPP
#define RICH_JSON_ENVIRONMENT_HPP

#include <nlohmann/json.hpp>
#include <functional>
#include <string>
#include <unordered_map>

namespace RichJson {

using json = nlohmann::json;

// Ported from other/RichJsonEnvironment.java. JSON values can't hold
// executable code (unlike Java's Object env map, which can hold a Supplier),
// so native C++ callables are registered in a separate `functions` table.
// When $env resolves a name found there, it returns a sentinel object that
// $invoke recognizes and calls; on any plain value, $invoke is a no-op.
class RichJsonEnvironment {
public:
    static inline const std::string NATIVE_FUNCTION_MEMBER = "__$_rich_json_native_function_$__";

    static std::unordered_map<std::string, json>& env() {
        static std::unordered_map<std::string, json> instance;
        return instance;
    }

    static std::unordered_map<std::string, std::function<json()>>& functions() {
        static std::unordered_map<std::string, std::function<json()>> instance;
        return instance;
    }

    static void addEnvironmentVariable(const std::string& name, const json& value);
    static void addEnvironmentVariables(const json& envs);
    static void registerFunction(const std::string& name, std::function<json()> fn);

    static bool hasEnv(const std::string& name) { return env().find(name) != env().end(); }
    static bool hasFunction(const std::string& name) { return functions().find(name) != functions().end(); }
};

} // namespace RichJson

#endif
