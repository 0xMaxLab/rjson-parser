#include "RichJsonHelper.hpp"
#include "../core/RichJsonConstants.hpp"
#include "../core/RichJsonParser.hpp"
#include <algorithm>
#include <cctype>
#include <iostream>
#include <regex>

namespace RichJson {

json RichJsonHelper::parse(json& object) {
    // Intentionally does not catch exceptions - matches the original JS
    // reference (core/RichJson_parse.js), not Java's port which added its
    // own swallow-and-log try/catch.
    RichJsonParser parser;
    return parser.parse(object, true);
}

void RichJsonHelper::keepKeyCommands(json& jsonObject) {
    if (!jsonObject.is_object()) return;
    auto it = jsonObject.find(RichJsonConstants::KEY_COMMAND_MEMBER);
    if (it != jsonObject.end()) {
        jsonObject[RichJsonConstants::KEY_COMMAND_MEMBER] = cloneObject(*it);
        jsonObject[RichJsonConstants::KEEP_KEY_COMMANDS_MARKER] = true;
    }
}

bool RichJsonHelper::isResolved(const json& object) {
    RichJsonCache cache;
    return isResolvedRecursive(cache, object, RichJsonCache::resolveAddress(object));
}

bool RichJsonHelper::isResolvedRecursive(RichJsonCache& cache, const json& object, const std::string& address) {
    if (object.is_null()) return true;

    if (cache.stack.find(address) != cache.stack.end()) return true;
    cache.stack[address] = object;

    bool isJsonObj = object.is_object();
    if (isJsonObj && (object.contains(RichJsonConstants::KEY_COMMAND_MEMBER) ||
                      object.contains(RichJsonConstants::LATE_CONSTRUCTOR_MEMBER))) {
        return false;
    }

    if (isJsonObj) {
        for (auto it = object.begin(); it != object.end(); ++it) {
            if (!checkMember(cache, it.value(), address)) return false;
        }
    } else if (object.is_array()) {
        for (const auto& member : object) {
            if (!checkMember(cache, member, address)) return false;
        }
    }
    return true;
}

bool RichJsonHelper::checkMember(RichJsonCache& cache, const json& member, const std::string& /*parentAddress*/) {
    if (!isMemberRichJsonAble(member)) return true;

    if (member.is_string()) {
        std::string str = member.get<std::string>();
        if (std::regex_search(str, RichJsonConstants::COMMAND_WILDCARD) ||
            std::regex_search(str, RichJsonConstants::INTERPOLATION_WILDCARD)) {
            return false;
        }
    } else {
        std::string memberAddress = RichJsonCache::resolveAddress(member);
        if (!isResolvedRecursive(cache, member, memberAddress)) return false;
    }
    return true;
}

json RichJsonHelper::mergeObjects(const std::vector<json>& objects) {
    return mergeIntoTarget(json::object(), objects);
}

json RichJsonHelper::mergeIntoTarget(json target, const std::vector<json>& others) {
    if (!target.is_object()) target = json::object();

    for (const auto& other : others) {
        if (other.is_null() || !other.is_object()) continue;

        RichJsonCache cache;
        mergeIntoTargetInternal(cache, target, other, false);

        if (cache.level != 0) {
            std::cerr << "RichJson mergeIntoTarget failed!\n";
        }
    }

    return target;
}

json RichJsonHelper::mergeIntoTarget(json target, const json& other) {
    return mergeIntoTarget(std::move(target), std::vector<json>{other});
}

json RichJsonHelper::mergeIntoTargetForce(json target, const json& other) {
    if (!target.is_object()) target = json::object();

    RichJsonCache cache;
    mergeIntoTargetInternal(cache, target, other, true);
    return target;
}

json& RichJsonHelper::mergeIntoTargetInternal(RichJsonCache& cache, json& target, const json& other, bool force) {
    cache.stack[RichJsonCache::resolveAddress(other)] = other;
    cache.level++;

    std::vector<std::string> names;
    names.reserve(other.size());
    for (auto it = other.begin(); it != other.end(); ++it) names.push_back(it.key());

    for (const auto& name : names) {
        const json& member = other.at(name);

        if (isJsonObject(member)) {
            auto targetIt = target.find(name);
            bool targetHasObj = targetIt != target.end() && isJsonObject(*targetIt);

            if (targetHasObj) {
                std::string memberAddr = RichJsonCache::resolveAddress(member);
                if (cache.stack.find(memberAddr) == cache.stack.end()) {
                    json& subTarget = target[name];
                    mergeIntoTargetInternal(cache, subTarget, member, force);
                }
            } else if (force || targetIt == target.end()) {
                target[name] = member;
            }
        } else if (force || !target.contains(name)) {
            target[name] = member;
        }
    }

    cache.level--;
    return target;
}

json RichJsonHelper::cloneObject(const json& object) {
    if (object.is_null()) return object;
    if (!object.is_object() && !object.is_array()) return object;

    RichJsonCache cache;
    cache.stack[RichJsonCache::resolveAddress(object)] = object.is_array() ? json::array() : json::object();
    json result = cloneObjectRecursive(cache, object);

    if (cache.level != 0) {
        std::cerr << "RichJson cloneObject failed!\n";
    }
    return result;
}

json RichJsonHelper::cloneObjectRecursive(RichJsonCache& cache, const json& object) {
    cache.level++;
    json target = object.is_array() ? json::array() : json::object();

    if (object.is_object()) {
        for (auto it = object.begin(); it != object.end(); ++it) {
            const json& member = it.value();
            if (member.is_object() || member.is_array()) {
                std::string addr = RichJsonCache::resolveAddress(member);
                auto cacheIt = cache.stack.find(addr);
                if (cacheIt == cache.stack.end()) {
                    cache.stack[addr] = member.is_array() ? json::array() : json::object();
                    target[it.key()] = cloneObjectRecursive(cache, member);
                } else {
                    target[it.key()] = cacheIt->second;
                }
            } else {
                target[it.key()] = member;
            }
        }
    } else {
        for (const auto& member : object) {
            if (member.is_object() || member.is_array()) {
                std::string addr = RichJsonCache::resolveAddress(member);
                auto cacheIt = cache.stack.find(addr);
                if (cacheIt == cache.stack.end()) {
                    cache.stack[addr] = member.is_array() ? json::array() : json::object();
                    target.push_back(cloneObjectRecursive(cache, member));
                } else {
                    target.push_back(cacheIt->second);
                }
            } else {
                target.push_back(member);
            }
        }
    }

    cache.level--;
    return target;
}

json RichJsonHelper::getFieldByKey(const json& object, const std::string& key) {
    if (object.is_null() || key.empty()) return json();

    if (object.is_object()) {
        auto it = object.find(key);
        return it != object.end() ? *it : json();
    }

    if (object.is_array()) {
        try {
            size_t pos = 0;
            unsigned long idx = std::stoul(key, &pos);
            if (pos == key.size() && idx < object.size()) return object[idx];
        } catch (...) {
            return json();
        }
    }

    return json();
}

std::vector<std::string> RichJsonHelper::getKeysSorted(const json& object) {
    std::vector<std::string> keys;
    if (!object.is_object()) return keys;

    for (auto it = object.begin(); it != object.end(); ++it) keys.push_back(it.key());

    std::sort(keys.begin(), keys.end(), [](const std::string& a, const std::string& b) {
        return std::lexicographical_compare(
            a.begin(), a.end(), b.begin(), b.end(),
            [](unsigned char c1, unsigned char c2) { return std::tolower(c1) < std::tolower(c2); });
    });

    return keys;
}

} // namespace RichJson
