#ifndef RICH_JSON_FILE_HELPER_HPP
#define RICH_JSON_FILE_HELPER_HPP

#include <nlohmann/json.hpp>
#include <string>

namespace RichJson {

using json = nlohmann::json;

// Ported from helper/RichJsonFileHelper.java.
class RichJsonFileHelper {
public:
    static json readFile(const std::string& pathStr, bool executeLateApplies);
    static json readDirectory(const std::string& pathStr, bool executeLateApplies);
};

} // namespace RichJson

#endif
