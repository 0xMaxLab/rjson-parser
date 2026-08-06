#ifndef RICH_JSON_HPP
#define RICH_JSON_HPP

#include "core/RichJsonCommandHolder.hpp"
#include "core/RichJsonConstants.hpp"
#include "core/RichJsonContext.hpp"
#include "core/RichJsonParser.hpp"
#include "helper/RichJsonFileHelper.hpp"
#include "helper/RichJsonHelper.hpp"
#include "module/RichJsonModule.hpp"
#include "module/RichJsonModuleManager.hpp"
#include "other/RichJsonClassMapping.hpp"
#include "other/RichJsonConfig.hpp"
#include "other/RichJsonEnvironment.hpp"
#include <memory>
#include <string>
#include <vector>

namespace RichJson {

inline const std::string KEY_COMMAND_MEMBER = RichJsonConstants::KEY_COMMAND_MEMBER;

inline json parse(json& object) {
    return RichJsonHelper::parse(object);
}

inline bool isResolved(const json& object) {
    return RichJsonHelper::isResolved(object);
}

inline void registerClass(const std::string& name, RichJsonClassMapping::Factory factory) {
    RichJsonClassMapping::addClassMapping(name, std::move(factory));
}

inline void addClassMapping(const std::string& name, RichJsonClassMapping::Factory factory) {
    RichJsonClassMapping::addClassMapping(name, std::move(factory));
}

inline void addClassMappings(const std::unordered_map<std::string, RichJsonClassMapping::Factory>& mappings) {
    RichJsonClassMapping::addClassMappings(mappings);
}

inline void addEnvironmentVariable(const std::string& name, const json& value) {
    RichJsonEnvironment::addEnvironmentVariable(name, value);
}

inline void addEnvironmentVariables(const json& envs) {
    RichJsonEnvironment::addEnvironmentVariables(envs);
}

inline void registerFunction(const std::string& name, std::function<json()> fn) {
    RichJsonEnvironment::registerFunction(name, std::move(fn));
}

inline std::shared_ptr<RichJsonModule> registerModule(std::shared_ptr<RichJsonModule> module) {
    return RichJsonModuleManager::registerModule(std::move(module));
}

inline void includeModule(const std::string& name) { RichJsonModuleManager::includeModule(name); }
inline bool isModuleRegistered(const std::string& name) { return RichJsonModuleManager::isModuleRegistered(name); }
inline void excludeModule(const std::string& name) { RichJsonModuleManager::excludeModule(name); }
inline void unregisterModule(const std::string& name) { RichJsonModuleManager::unregisterModule(name); }

inline json readFile(const std::string& path, bool executeLateApplies = false) {
    return RichJsonFileHelper::readFile(path, executeLateApplies);
}

inline json readDirectory(const std::string& path, bool executeLateApplies = false) {
    return RichJsonFileHelper::readDirectory(path, executeLateApplies);
}

inline json mergeObjects(const std::vector<json>& objects) { return RichJsonHelper::mergeObjects(objects); }

inline json mergeIntoTarget(json target, const std::vector<json>& others) {
    return RichJsonHelper::mergeIntoTarget(std::move(target), others);
}

inline json mergeIntoTarget(json target, const json& other) {
    return RichJsonHelper::mergeIntoTarget(std::move(target), other);
}

inline json cloneObject(const json& object) { return RichJsonHelper::cloneObject(object); }
inline bool isJsonObject(const json& object) { return RichJsonHelper::isJsonObject(object); }
inline std::vector<std::string> getKeysSorted(const json& object) { return RichJsonHelper::getKeysSorted(object); }

inline void keepKeyCommands(json& jsonObject) { RichJsonHelper::keepKeyCommands(jsonObject); }

inline void setCommandEnabled(const std::string& cmd, bool enabled) {
    RichJsonCommandHolder::setCommandEnabled(cmd, enabled);
}

}

#endif
