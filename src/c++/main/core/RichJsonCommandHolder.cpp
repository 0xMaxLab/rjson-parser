#include "RichJsonCommandHolder.hpp"
#include "RichJsonConstants.hpp"
#include "RichJsonContext.hpp"
#include "RichJsonParser.hpp"
#include "../commands/RichJson_clone.hpp"
#include "../commands/RichJson_copy.hpp"
#include "../commands/RichJson_env.hpp"
#include "../commands/RichJson_file.hpp"
#include "../commands/RichJson_folder.hpp"
#include "../commands/RichJson_invoke.hpp"
#include "../commands/RichJson_merge.hpp"
#include "../commands/RichJson_merge_folder.hpp"
#include "../commands/RichJson_ref.hpp"
#include "../commands/RichJson_this.hpp"
#include <stdexcept>

namespace RichJson {

RichJsonCommandHolder::RichJsonCommandHolder() {
    registerBuiltInCommands();
    enabled = available;
    builtIn = available;
}

void RichJsonCommandHolder::registerBuiltInCommands() {
    available["ref"] = richJson_ref;
    available["this"] = richJson_this;
    available["env"] = richJson_env;
    available["merge"] = richJson_merge;
    available["copy"] = richJson_copy;
    available["clone"] = richJson_clone;
    available["file"] = richJson_file;
    available["folder"] = richJson_folder;
    available["merge_folder"] = richJson_merge_folder;
    available["invoke"] = richJson_invoke;
}

json RichJsonCommandHolder::executeCommand(const std::string& commandName, RichJsonParser& parser, RichJsonContext& context) {
    auto& holder = instance();
    auto it = holder.enabled.find(commandName);

    if (it == holder.enabled.end()) {
        return json(RichJsonConstants::COMMAND_PREFIX + commandName + RichJsonConstants::COMMAND_SUFFIX +
                     (context.currentMember.is_string() ? context.currentMember.get<std::string>() : context.currentMember.dump()));
    }

    return it->second(parser, context);
}

void RichJsonCommandHolder::setCommandEnabled(const std::string& command, bool isEnabled) {
    auto& holder = instance();

    if (holder.available.find(command) == holder.available.end()) {
        throwCommandNotFound(command);
    }

    if (isEnabled) {
        holder.enabled[command] = holder.available[command];
    } else {
        holder.enabled.erase(command);
    }
}

bool RichJsonCommandHolder::isCommandEnabled(const std::string& command) {
    auto& holder = instance();
    if (holder.available.find(command) == holder.available.end()) {
        throwCommandNotFound(command);
    }
    return holder.enabled.find(command) != holder.enabled.end();
}

void RichJsonCommandHolder::throwCommandNotFound(const std::string& command) {
    throw std::runtime_error("RichJson Command '" + command + "' not found");
}

}
