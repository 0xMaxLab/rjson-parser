#include "RichJsonHelper.hpp"

class RichJsonParser;

Dynamic RichJsonHelper::parse(Dynamic object) {
    try {
        RichJsonParser parser;
        return parser.parse(object, true);
    } catch (const std::exception& exception) {
        std::cerr << "[ERROR] " << exception.what() << "\n";
        return Dynamic{};
    }
}

Dynamic RichJsonHelper::keepKeyCommands(Dynamic jsonObject) {
    if (!jsonObject.isMap()) {
        return jsonObject;
    }

    auto& map = jsonObject.asMap();
    if (map.find(RichJsonConstants::KEY_COMMAND_MEMBER) != map.end()) {
        Dynamic commands = map[RichJsonConstants::KEY_COMMAND_MEMBER];
        Dynamic clonedCommands = RichJsonHelper::cloneObject(commands);
        map[RichJsonConstants::KEY_COMMAND_MEMBER] = clonedCommands;
    }

    return jsonObject;
}

bool RichJsonHelper::isResolved(Dynamic object) {
    RichJsonParser parser;
    return isResolvedRecursive(parser, object, parser.cache.resolveAddress(object));
}

bool RichJsonHelper::isResolvedRecursive(RichJsonParser& parser, Dynamic object, const std::string& address) {
    if (!object.value.has_value()) {
        return true;
    }

    if (parser.cache.stack.find(address) != parser.cache.stack.end()) {
        return true;
    }
    parser.cache.stack[address] = object;

    bool isJsonObj = object.isMap();

    if (isJsonObj) {
        auto& map = object.asMap();
        if (map.find(RichJsonConstants::KEY_COMMAND_MEMBER) != map.end() ||
            map.find(RichJsonConstants::LATE_CONSTRUCTOR_MEMBER) != map.end()) {
            return false;
        }
    }

    if (isJsonObj) {
        auto& map = object.asMap();
        for (const auto& [key, value] : map) {
            if (!checkMember(parser, value, key, address)) {
                return false;
            }
        }
    } else if (object.isList()) {
        auto& list = object.asList();
        for (size_t i = 0; i < list.size(); i++) {
            if (!checkMember(parser, list[i], std::to_string(i), address)) {
                return false;
            }
        }
    }

    return true;
}

bool RichJsonHelper::checkMember(RichJsonParser& parser, Dynamic member, const std::string& keyOrIndex, const std::string& parentAddress) {
    if (!parser.__isMemberRichJsonAble(member)) {
        return true;
    }

    if (member.isString()) {
        std::string str = member.asString();
        if (std::regex_search(str, RichJsonConstants::COMMAND_WILDCARD) ||
            std::regex_search(str, RichJsonConstants::INTERPOLATION_WILDCARD)) {
            return false;
        }
    } else {
        std::string memberAddress = parser.cache.resolveAddress(member);
        if (!isResolvedRecursive(parser, member, memberAddress)) {
            return false;
        }
    }
    return true;
}

Dynamic RichJsonHelper::mergeObjects(const std::vector<Dynamic>& objects) {
    Dynamic target{DynamicMap{}};
    return mergeIntoTarget(target, objects);
}

Dynamic RichJsonHelper::mergeIntoTarget(Dynamic& target, const std::vector<Dynamic>& others) {
    if (!target.isMap()) {
        target = Dynamic{DynamicMap{}};
    }

    auto& targetMap = target.asMap();

    for (const auto& other : others) {
        if (!other.value.has_value() || !other.isMap()) continue;

        const auto& otherMap = other.asMap();
        RichJsonCache cache;
        __mergeIntoTarget(cache, targetMap, otherMap, false);

        if (cache.level != 0) {
            std::cerr << "RichJson mergeIntoTarget failed!\n";
        }
    }

    return target;
}

DynamicMap& RichJsonHelper::__mergeIntoTarget(RichJsonCache& cache, DynamicMap& target, const DynamicMap& other, bool force) {
    Dynamic wrapper{other};
    cache.stack[cache.resolveAddress(wrapper)] = wrapper;
    cache.level++;

    for (const auto& [name, member] : other) {
        if (member.value.has_value() && isJsonObject(member)) {
            if (target.find(name) != target.end() && isJsonObject(target[name])) {
                Dynamic memberWrapper{member};
                if (cache.stack.find(cache.resolveAddress(memberWrapper)) == cache.stack.end()) {
                    auto& subTargetMap = target[name].asMap();
                    __mergeIntoTarget(cache, subTargetMap, member.asMap(), force);
                }
            } else if (force || target.find(name) == target.end()) {
                target[name] = member;
            }
        } else if (force || target.find(name) == target.end()) {
            target[name] = member;
        }
    }

    cache.level--;
    return target;
}

Dynamic RichJsonHelper::cloneObject(Dynamic object) {
    if (!object.value.has_value()) return object;

    RichJsonCache cache;
    Dynamic rootClone;

    if (object.isList()) {
        rootClone = Dynamic{DynamicList{}};
    } else if (isJsonObject(object)) {
        rootClone = Dynamic{DynamicMap{}};
    } else {
        return object;
    }

    cache.stack[cache.resolveAddress(object)] = rootClone;
    Dynamic result = _cloneObject(cache, object, rootClone);

    if (cache.level != 0) {
        std::cerr << "RichJson cloneObject failed!\n";
    }
    return result;
}

Dynamic RichJsonHelper::_cloneObject(RichJsonCache& cache, Dynamic object, Dynamic target) {
    cache.level++;

    if (object.isMap()) {
        auto& sourceMap = object.asMap();
        auto& targetMap = target.asMap();

        for (const auto& [name, member] : sourceMap) {
            processCloneMember(cache, targetMap, name, member);
        }
    } else if (object.isList()) {
        auto& sourceList = object.asList();
        auto& targetList = target.asList();

        for (const auto& member : sourceList) {
            if (isJsonObject(member) || member.isList()) {
                std::string addr = cache.resolveAddress(member);
                if (cache.stack.find(addr) == cache.stack.end()) {
                    Dynamic newObj = member.isList() ? Dynamic{DynamicList{}} : Dynamic{DynamicMap{}};
                    cache.stack[addr] = newObj;
                    targetList.push_back(_cloneObject(cache, member, newObj));
                } else {
                    targetList.push_back(cache.stack[addr]);
                }
            } else {
                targetList.push_back(member);
            }
        }
    }

    cache.level--;
    return target;
}

void RichJsonHelper::processCloneMember(RichJsonCache& cache, DynamicMap& targetMap, const std::string& name, Dynamic member) {
    if (isJsonObject(member) || member.isList()) {
        std::string addr = cache.resolveAddress(member);
        if (cache.stack.find(addr) == cache.stack.end()) {
            Dynamic newObj = member.isList() ? Dynamic{DynamicList{}} : Dynamic{DynamicMap{}};
            cache.stack[addr] = newObj;
            targetMap[name] = _cloneObject(cache, member, newObj);
        } else {
            targetMap[name] = cache.stack[addr];
        }
    } else {
        targetMap[name] = member;
    }
}

bool RichJsonHelper::isJsonObject(const Dynamic& object) {
    if (!object.value.has_value()) return false;
    return object.isMap();
}

Dynamic RichJsonHelper::getFieldByKey(const Dynamic& object, const std::string& key) {
    if (!object.value.has_value() || key.empty()) {
        return Dynamic{};
    }

    if (object.isMap()) {
        const auto& map = object.asMap();
        if (map.find(key) != map.end()) {
            return map.at(key);
        }
    }

    if (object.isList()) {
        const auto& list = object.asList();
        try {
            size_t index = std::stoul(key);
            if (index < list.size()) {
                return list[index];
            }
        } catch (...) {
            return Dynamic{};
        }
    }

    return Dynamic{};
}

std::vector<std::string> RichJsonHelper::getKeysSorted(const Dynamic& object) {
    std::vector<std::string> keys;
    if (object.isMap()) {
        const auto& map = object.asMap();
        for (const auto& [k, v] : map) {
            keys.push_back(k);
        }
        std::sort(keys.begin(), keys.end(), [](const std::string& a, const std::string& b) {
            return std::lexicographical_compare(
                a.begin(), a.end(), b.begin(), b.end(),
                [](char c1, char c2) {
                    return std::tolower(c1) < std::tolower(c2);
                }
            );
        });
    }
    return keys;
}