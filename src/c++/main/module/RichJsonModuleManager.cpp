#include "RichJsonModuleManager.hpp"
#include "../other/RichJsonConfig.hpp"
#include <iostream>
#include <stdexcept>

namespace RichJson {

std::shared_ptr<RichJsonModule> RichJsonModuleManager::registerModule(std::shared_ptr<RichJsonModule> module) {
    if (__RICH_JSON_CONFIG.infoEnabled) {
        std::cout << "RichJSON: registering module '" << module->name << "'\n";
    }
    modules()[module->name] = module;
    return module;
}

void RichJsonModuleManager::unregisterModule(const std::string& name) {
    if (!isModuleRegistered(name)) return;

    if (modules()[name]->isIncluded) {
        throw std::runtime_error("RichJSON: Cannot unregister module '" + name + "' while it is included.");
    }
    if (__RICH_JSON_CONFIG.infoEnabled) {
        std::cout << "RichJSON: unregistering module '" << name << "'\n";
    }
    modules().erase(name);
}

bool RichJsonModuleManager::isModuleRegistered(const std::string& name) {
    return modules().find(name) != modules().end();
}

void RichJsonModuleManager::includeModule(const std::string& name) {
    if (!isModuleRegistered(name)) return;
    auto& module = modules()[name];
    if (!module->isIncluded) {
        if (__RICH_JSON_CONFIG.infoEnabled) {
            std::cout << "RichJSON: including module '" << name << "'\n";
        }
        module->include();
    }
}

void RichJsonModuleManager::excludeModule(const std::string& name) {
    if (!isModuleRegistered(name)) return;
    auto& module = modules()[name];
    if (module->isIncluded) {
        if (__RICH_JSON_CONFIG.infoEnabled) {
            std::cout << "RichJSON: excluding module '" << name << "'\n";
        }
        module->exclude();
    }
}

}
