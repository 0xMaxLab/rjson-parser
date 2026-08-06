#ifndef RICH_JSON_CACHE_HPP
#define RICH_JSON_CACHE_HPP

#include <nlohmann/json.hpp>
#include <cstdint>
#include <memory>
#include <optional>
#include <string>
#include <unordered_map>

namespace RichJson {

using json = nlohmann::json;

class RichJsonCache {
public:
    int level = 0;
    std::optional<std::string> cloneAddress;
    std::unordered_map<std::string, std::string> inheritances;
    std::unordered_map<std::string, json> stack;

    static std::string resolveAddress(const json& obj) {
        return std::to_string(reinterpret_cast<std::uintptr_t>(std::addressof(obj)));
    }
};

}

#endif
