#ifndef RICH_JSON_HELPER_HPP
#define RICH_JSON_HELPER_HPP

#include "../core/RichJsonParser.hpp"
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <iostream>

class RichJsonHelper {
public:
    static Dynamic parse(Dynamic object);
    static Dynamic keepKeyCommands(Dynamic jsonObject);
    static bool isResolved(Dynamic object);
    static Dynamic mergeObjects(const std::vector<Dynamic>& objects);
    static Dynamic mergeIntoTarget(Dynamic& target, const std::vector<Dynamic>& others);
    static DynamicMap& __mergeIntoTarget(RichJsonCache& cache, DynamicMap& target, const DynamicMap& other, bool force);
    static Dynamic cloneObject(Dynamic object);
    static bool isJsonObject(const Dynamic& object);
    static Dynamic getFieldByKey(const Dynamic& object, const std::string& key);
    static std::vector<std::string> getKeysSorted(const Dynamic& object);

private:
    static bool isResolvedRecursive(RichJsonParser& parser, Dynamic object, const std::string& address);
    static bool checkMember(RichJsonParser& parser, Dynamic member, const std::string& keyOrIndex, const std::string& parentAddress);
    static Dynamic _cloneObject(RichJsonCache& cache, Dynamic object, Dynamic target);
    static void processCloneMember(RichJsonCache& cache, DynamicMap& targetMap, const std::string& name, Dynamic member);
};

#endif