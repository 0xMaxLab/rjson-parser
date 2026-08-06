#include "RichJsonModule.hpp"
#include "../core/RichJsonCommandHolder.hpp"
#include <algorithm>
#include <stdexcept>

namespace RichJson {

RichJsonModule& RichJsonModule::addLateApply(const std::string& commandName, RichJsonCommand func, std::vector<std::string> ignores) {
    lateApplies.push_back(commandName);
    if (!ignores.empty()) kcmdIgnores[commandName] = ignores;
    return addCommand(commandName, std::move(func), std::move(ignores));
}

RichJsonModule& RichJsonModule::addCommand(const std::string& commandName, RichJsonCommand func, std::vector<std::string> ignores) {
    commands[commandName] = std::move(func);
    if (!ignores.empty()) kcmdIgnores[commandName] = std::move(ignores);
    return *this;
}

void RichJsonModule::include() {
    auto& holder = RichJsonCommandHolder::instance();
    isIncluded = true;

    for (const auto& [cmdName, func] : commands) {
        if (holder.builtIn.find(cmdName) != holder.builtIn.end()) {
            throw std::runtime_error("RichJSON: You cannot override built-in commands. Affected: '#" + cmdName + "'");
        }
        holder.available[cmdName] = func;
        holder.enabled[cmdName] = func;
    }

    for (const auto& cmdName : lateApplies) {
        if (std::find(RichJsonCommandHolder::lateApplies.begin(), RichJsonCommandHolder::lateApplies.end(), cmdName) ==
            RichJsonCommandHolder::lateApplies.end()) {
            RichJsonCommandHolder::lateApplies.push_back(cmdName);
        }
    }

    for (const auto& [cmdName, ignored] : kcmdIgnores) {
        holder.kcmdIgnored[cmdName] = ignored;
    }
}

void RichJsonModule::exclude() {
    auto& holder = RichJsonCommandHolder::instance();
    isIncluded = false;

    for (const auto& cmdName : lateApplies) {
        auto& la = RichJsonCommandHolder::lateApplies;
        la.erase(std::remove(la.begin(), la.end(), cmdName), la.end());
    }

    for (const auto& [cmdName, func] : commands) {
        (void)func;
        holder.available.erase(cmdName);
        holder.enabled.erase(cmdName);
        holder.kcmdIgnored.erase(cmdName);
    }
}

}
