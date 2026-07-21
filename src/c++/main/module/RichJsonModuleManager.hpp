#ifndef RICH_JSON_MODULE_MANAGER_HPP
#define RICH_JSON_MODULE_MANAGER_HPP

#include "RichJsonModule.hpp"
#include <memory>
#include <string>
#include <unordered_map>

namespace RichJson {

// Ported from module/RichJsonModuleManager.java.
class RichJsonModuleManager {
public:
    static std::shared_ptr<RichJsonModule> registerModule(std::shared_ptr<RichJsonModule> module);
    static void unregisterModule(const std::string& name);
    static bool isModuleRegistered(const std::string& name);
    static void includeModule(const std::string& name);
    static void excludeModule(const std::string& name);

private:
    static std::unordered_map<std::string, std::shared_ptr<RichJsonModule>>& modules() {
        static std::unordered_map<std::string, std::shared_ptr<RichJsonModule>> instance;
        return instance;
    }
};

} // namespace RichJson

#endif
