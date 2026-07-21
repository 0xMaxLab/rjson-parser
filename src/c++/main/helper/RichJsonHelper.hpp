#ifndef RICH_JSON_HELPER_HPP
#define RICH_JSON_HELPER_HPP

#include "../core/RichJsonCache.hpp"
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

namespace RichJson {

using json = nlohmann::json;

// Ported from helper/RichJsonHelper.java. Everything here operates on plain
// nlohmann::json values - there's no separate "POJO" case like Java's
// isJsonObject (which also accepted arbitrary non-Map/List/primitive
// instances), since every RichJson value in the C++ port *is* a json value.
class RichJsonHelper {
public:
    // Resolves RichJson expressions in `object` in place and also returns it.
    // Does NOT swallow exceptions (matching the original JS reference
    // implementation; Java's port added its own try/catch, which this
    // intentionally does not replicate).
    static json parse(json& object);

    static void keepKeyCommands(json& jsonObject);
    static bool isResolved(const json& object);

    static json mergeObjects(const std::vector<json>& objects);
    static json mergeIntoTarget(json target, const std::vector<json>& others);
    static json mergeIntoTarget(json target, const json& other);
    // force=true variant used by constructors ($=Name/$==Name): the other's
    // fields always win, even over target's existing fields.
    static json mergeIntoTargetForce(json target, const json& other);

    static json cloneObject(const json& object);
    static bool isJsonObject(const json& object) { return object.is_object(); }
    static json getFieldByKey(const json& object, const std::string& key);
    static std::vector<std::string> getKeysSorted(const json& object);

    // Exposed for RichJsonParser (constructors/late-constructors need a
    // force-merge with an explicit cache, mirroring Java's package-private
    // __mergeIntoTarget).
    static json& mergeIntoTargetInternal(RichJsonCache& cache, json& target, const json& other, bool force);

private:
    static bool isResolvedRecursive(RichJsonCache& cache, const json& object, const std::string& address);
    static bool checkMember(RichJsonCache& cache, const json& member, const std::string& parentAddress);
    static json cloneObjectRecursive(RichJsonCache& cache, const json& object);
};

} // namespace RichJson

#endif
