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

// Ported from core/RichJsonCache.java. `stack` memoizes already-resolved
// values by address to avoid re-resolving the same node twice and to break
// cycles (e.g. a key that (indirectly) references itself). `resolveAddress`
// mirrors Java's System.identityHashCode(obj): a pointer-based identity for
// container nodes, valid for the duration of a single parse() call.
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

} // namespace RichJson

#endif
