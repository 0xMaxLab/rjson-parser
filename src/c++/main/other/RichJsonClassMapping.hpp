#ifndef RICH_JSON_CLASS_MAPPING_HPP
#define RICH_JSON_CLASS_MAPPING_HPP

#include <nlohmann/json.hpp>
#include <functional>
#include <string>
#include <unordered_map>

namespace RichJson {

using json = nlohmann::json;

class RichJsonClassMapping {
public:
    using Factory = std::function<json()>;

    static std::unordered_map<std::string, Factory>& mapping() {
        static std::unordered_map<std::string, Factory> instance;
        return instance;
    }

    static void addClassMapping(const std::string& name, Factory factory);
    static void addClassMappings(const std::unordered_map<std::string, Factory>& mappings);
    static const Factory& mapClassByName(const std::string& name);
};

}

#endif
