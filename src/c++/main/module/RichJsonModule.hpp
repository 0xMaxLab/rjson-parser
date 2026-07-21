#ifndef RICH_JSON_MODULE_HPP
#define RICH_JSON_MODULE_HPP

#include "../core/RichJsonCommand.hpp"
#include <string>
#include <unordered_map>
#include <vector>

namespace RichJson {

// Ported from module/RichJsonModule.java. Groups related commands and
// late-apply rules for inclusion/exclusion as a unit. `ignores` defaults to
// empty (Java requires it explicitly; the C++ test file calls addCommand/
// addLateApply with just a name and a function).
class RichJsonModule {
public:
    explicit RichJsonModule(std::string moduleName) : name(std::move(moduleName)) {}

    std::string name;
    std::vector<std::string> lateApplies;
    std::unordered_map<std::string, RichJsonCommand> commands;
    std::unordered_map<std::string, std::vector<std::string>> kcmdIgnores;
    bool isIncluded = false;

    RichJsonModule& addLateApply(const std::string& commandName, RichJsonCommand func, std::vector<std::string> ignores = {});
    RichJsonModule& addCommand(const std::string& commandName, RichJsonCommand func, std::vector<std::string> ignores = {});

    void include();
    void exclude();
};

} // namespace RichJson

#endif
