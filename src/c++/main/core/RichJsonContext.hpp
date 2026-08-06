#ifndef RICH_JSON_CONTEXT_HPP
#define RICH_JSON_CONTEXT_HPP

#include <nlohmann/json.hpp>
#include <string>
#include <vector>

namespace RichJson {

using json = nlohmann::json;

struct RichJsonContext {
    json* root = nullptr;
    json* current = nullptr;
    json currentMember;
    std::string currentCommand;
    std::string currentAddress;
    std::string currentName;
    std::vector<std::string> currentPath;

    std::string rootAddress;
    std::string containerAddress;
};

}

#endif
