#include "RichJsonClassMapping.hpp"
#include <iostream>
#include <stdexcept>

namespace RichJson {

void RichJsonClassMapping::addClassMapping(const std::string& name, Factory factory) {
    if (mapping().find(name) != mapping().end()) {
        std::cerr << "[WARN] RichJson has the class '" << name << "' already defined\n";
        return;
    }
    mapping()[name] = std::move(factory);
}

void RichJsonClassMapping::addClassMappings(const std::unordered_map<std::string, Factory>& mappings) {
    for (const auto& [name, factory] : mappings) {
        addClassMapping(name, factory);
    }
}

const RichJsonClassMapping::Factory& RichJsonClassMapping::mapClassByName(const std::string& name) {
    auto it = mapping().find(name);
    if (it == mapping().end()) {
        throw std::invalid_argument(
            "RichJSON could not find the class called '" + name + "'.\nMake sure its registered via registerClass().");
    }
    return it->second;
}

}
