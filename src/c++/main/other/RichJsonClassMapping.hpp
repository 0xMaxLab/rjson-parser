#ifndef RICH_JSON_CLASS_MAPPING_HPP
#define RICH_JSON_CLASS_MAPPING_HPP

#include <nlohmann/json.hpp>
#include <functional>
#include <string>
#include <unordered_map>

namespace RichJson {

using json = nlohmann::json;

// Ported from other/RichJsonClassMapping.java. C++ has no reflection, so
// instead of mapping a name to a Class<?> that gets instantiated via
// reflection, we map a name to a factory function that produces the class's
// default JSON shape. $=Name / $==Name merge that shape's fields (as
// defaults) with the member's own explicit fields.
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

} // namespace RichJson

#endif
