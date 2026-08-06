#include "RichJsonFileHelper.hpp"
#include "../core/RichJsonCommandHolder.hpp"
#include "../core/RichJsonParser.hpp"
#include "../other/RichJsonConfig.hpp"
#include "RichJsonHelper.hpp"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <unordered_map>

namespace RichJson {

namespace fs = std::filesystem;

namespace {

std::unordered_map<std::string, json>& fileCache() {
    static std::unordered_map<std::string, json> instance;
    return instance;
}

void setLateAppliesEnabled(bool enabled) {
    for (const auto& cmd : RichJsonCommandHolder::lateApplies) {
        RichJsonCommandHolder::setCommandEnabled(cmd, enabled);
    }
}

} // namespace

json RichJsonFileHelper::readFile(const std::string& pathStr, bool executeLateApplies) {
    if (__RICH_JSON_CONFIG.fileCacheEnabled) {
        auto it = fileCache().find(pathStr);
        if (it != fileCache().end()) return it->second;
        fileCache()[pathStr] = json::object();
    }

    if (!executeLateApplies) setLateAppliesEnabled(false);

    json rv;
    try {
        std::ifstream in(pathStr, std::ios::binary);
        if (!in) throw std::runtime_error("could not open file");
        std::ostringstream ss;
        ss << in.rdbuf();
        rv = json::parse(ss.str());

        RichJsonParser parser;
        rv = parser.parse(rv, true);
    } catch (const std::exception& e) {
        throw std::runtime_error("Error reading RichJson file: " + pathStr + " (" + e.what() + ")");
    }

    if (!executeLateApplies) setLateAppliesEnabled(true);

    if (__RICH_JSON_CONFIG.fileCacheEnabled) {
        json& cached = fileCache()[pathStr];
        if (cached.is_object() && rv.is_object()) {
            cached = RichJsonHelper::mergeIntoTarget(cached, rv);
        } else {
            fileCache()[pathStr] = rv;
        }
    }

    return rv;
}

json RichJsonFileHelper::readDirectory(const std::string& pathStr, bool executeLateApplies) {
    json rv = json::object();
    std::error_code ec;
    if (!fs::exists(pathStr, ec) || !fs::is_directory(pathStr, ec)) return rv;

    if (!executeLateApplies) setLateAppliesEnabled(false);

    for (const auto& entry : fs::directory_iterator(pathStr)) {
        std::string name = entry.path().filename().string();
        if (entry.is_regular_file()) {
            std::string nameWithoutExt = name;
            auto dotPos = name.find_last_of('.');
            if (dotPos != std::string::npos) nameWithoutExt = name.substr(0, dotPos);
            rv[nameWithoutExt] = readFile(entry.path().string(), true);
        } else if (entry.is_directory()) {
            rv[name] = readDirectory(entry.path().string(), true);
        }
    }

    if (!executeLateApplies) setLateAppliesEnabled(true);

    return rv;
}

}
