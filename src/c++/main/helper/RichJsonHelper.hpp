#ifndef RICH_JSON_HELPER_HPP
#define RICH_JSON_HELPER_HPP

#include "../core/RichJsonCache.hpp"
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

namespace RichJson {

using json = nlohmann::json;

class RichJsonHelper {
public:
    static json parse(json& object);

    static void keepKeyCommands(json& jsonObject);
    static bool isResolved(const json& object);

    static json mergeObjects(const std::vector<json>& objects);
    static json mergeIntoTarget(json target, const std::vector<json>& others);
    static json mergeIntoTarget(json target, const json& other);
    static json mergeIntoTargetForce(json target, const json& other);

    static json cloneObject(const json& object);
    static bool isJsonObject(const json& object) { return object.is_object(); }
    static json getFieldByKey(const json& object, const std::string& key);
    static std::vector<std::string> getKeysSorted(const json& object);

    static json& mergeIntoTargetInternal(RichJsonCache& cache, json& target, const json& other, bool force);

private:
    static bool isResolvedRecursive(RichJsonCache& cache, const json& object, const std::string& address);
    static bool checkMember(RichJsonCache& cache, const json& member, const std::string& parentAddress);
    static json cloneObjectRecursive(RichJsonCache& cache, const json& object);
};

}

#endif
