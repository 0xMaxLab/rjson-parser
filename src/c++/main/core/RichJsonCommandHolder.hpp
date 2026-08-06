#ifndef RICH_JSON_COMMAND_HOLDER_HPP
#define RICH_JSON_COMMAND_HOLDER_HPP

#include "RichJsonCommand.hpp"
#include <string>
#include <unordered_map>
#include <vector>

namespace RichJson {

class RichJsonCommandHolder {
public:
    static RichJsonCommandHolder& instance() {
        static RichJsonCommandHolder holder;
        return holder;
    }

    std::unordered_map<std::string, RichJsonCommand> available;
    std::unordered_map<std::string, RichJsonCommand> enabled;
    std::unordered_map<std::string, RichJsonCommand> builtIn;
    std::unordered_map<std::string, std::vector<std::string>> kcmdIgnored;
    static inline std::vector<std::string> lateApplies;

    static json executeCommand(const std::string& commandName, RichJsonParser& parser, RichJsonContext& context);
    static void setCommandEnabled(const std::string& command, bool isEnabled);
    static bool isCommandEnabled(const std::string& command);
    [[noreturn]] static void throwCommandNotFound(const std::string& command);

private:
    RichJsonCommandHolder();
    void registerBuiltInCommands();
};

}

#endif
