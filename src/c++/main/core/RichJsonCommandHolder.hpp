#ifndef RICH_JSON_COMMAND_HOLDER_HPP
#define RICH_JSON_COMMAND_HOLDER_HPP

#include "RichJsonCommand.hpp"
#include <string>
#include <unordered_map>
#include <vector>

namespace RichJson {

// Ported from core/RichJsonCommandHolder.java. Registers the built-in
// commands and tracks which are currently enabled (a disabled command
// resolves to a VOID_COMMAND that echoes the raw "$cmd:member" text back,
// same as Java).
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

} // namespace RichJson

#endif
