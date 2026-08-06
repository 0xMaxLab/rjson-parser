#include "RichJsonParser.hpp"
#include "RichJsonCommandHolder.hpp"
#include "RichJsonConstants.hpp"
#include "../helper/RichJsonHelper.hpp"
#include "../other/RichJsonClassMapping.hpp"
#include "../other/RichJsonConfig.hpp"
#include <algorithm>

namespace RichJson {

namespace {

std::string trim(const std::string& s) {
    size_t start = s.find_first_not_of(" \t\n\r");
    if (start == std::string::npos) return "";
    size_t end = s.find_last_not_of(" \t\n\r");
    return s.substr(start, end - start + 1);
}

std::vector<std::string> splitAll(const std::string& s, char delim) {
    std::vector<std::string> parts;
    std::string cur;
    for (char c : s) {
        if (c == delim) {
            parts.push_back(cur);
            cur.clear();
        } else {
            cur += c;
        }
    }
    parts.push_back(cur);
    while (parts.size() > 1 && parts.back().empty()) parts.pop_back();
    return parts;
}

} // namespace

RichJsonParser::RichJsonParser()
    : id_(++NEXT_ID),
      label_("RichJSON (PID " + std::to_string(id_) + "):"),
      logger(label_) {}

std::string RichJsonParser::joinPath(const std::vector<std::string>& path, const std::string& delimiter) {
    std::string s;
    for (size_t i = 0; i < path.size(); ++i) {
        s += path[i];
        if (i + 1 < path.size()) s += delimiter;
    }
    return s;
}

json RichJsonParser::parse(json& current, bool isRoot) {
    if (isRoot) {
        logger.info("is going to be applied...");
        logger.groupStart();
        logger.timeStart();

        con.root = &current;
        con.current = &current;
        con.currentName = "root";
        con.currentMember = current;
        con.currentAddress = RichJsonCache::resolveAddress(current);
        con.rootAddress = con.currentAddress;
        con.containerAddress = con.currentAddress;

        try {
            current = parseRichJsonInMember();
        } catch (...) {
            current = con.currentMember;
            cache.level--;
            logger.groupEndAll();
            throw;
        }

        cache.level--;
        logger.groupEndAll();

        if (cache.level == -1) {
            logger.info("was applied successfully.");
        } else {
            logger.error("was not applied successfully.");
        }
        logger.timeEnd();
        return current;
    }

    con.current = &current;
    std::string pathStr = joinPath(con.currentPath, RichJsonConstants::COMMAND_PATH_DELIMITER);
    logger.debug("step into level " + std::to_string(cache.level) + " at '" + pathStr + "'");
    logger.groupStart();
    cache.level++;

    bool isJsonObj = current.is_object();
    std::string currentName = con.currentName;
    std::string currentAddress = con.currentAddress;
    con.containerAddress = currentAddress;

    if (isJsonObj) {
        preprocessKcommandsConstructorsInheritances();
        auto sortedKeys = RichJsonHelper::getKeysSorted(current);

        for (const auto& name : sortedKeys) {
            json& member = current[name];
            con.currentMember = member;
            con.currentAddress = currentAddress + "_" + name;
            con.currentName = name;
            con.currentMember = parseRichJsonInMember();
            current[name] = con.currentMember;
        }
    } else if (current.is_array()) {
        for (size_t i = 0; i < current.size(); i++) {
            json& member = current[i];
            con.currentMember = member;
            con.currentAddress = currentAddress + "_" + std::to_string(i);
            con.currentName = currentName + "[" + std::to_string(i) + "]";
            con.currentMember = parseRichJsonInMember();
            current[i] = con.currentMember;
        }
    }

    cache.level--;
    logger.groupEnd();
    logger.debug("step out of level " + std::to_string(cache.level) + " at '" + pathStr + "'");
    return current;
}

void RichJsonParser::preprocessKcommandsConstructorsInheritances() {
    json& currentMap = *con.current;
    std::vector<std::string> names;
    names.reserve(currentMap.size());
    for (auto it = currentMap.begin(); it != currentMap.end(); ++it) names.push_back(it.key());

    for (const auto& name : names) {
        bool iscmd = RichJsonConstants::isCommand(name);
        bool isctr = RichJsonConstants::isConstructor(name);
        bool isite = RichJsonConstants::isInheritance(name);

        if (!(iscmd || isctr || isite)) continue;

        json member = currentMap[name];
        currentMap.erase(name);
        std::string processedName = name;

        if (iscmd) {
            size_t pos = processedName.find(RichJsonConstants::COMMAND_SUFFIX);
            std::string cmdPart = processedName.substr(0, pos);
            processedName = processedName.substr(pos + 1);

            auto kcmdList = splitAll(cmdPart.substr(1), RichJsonConstants::COMMAND_PREFIX[0]);
            if (member.is_object()) {
                member[RichJsonConstants::KEY_COMMAND_MEMBER] = kcmdList;
            }
        }

        std::string ite;
        if (isite) {
            size_t pos = processedName.find(RichJsonConstants::INHERITANCE_SIGN);
            ite = trim(processedName.substr(pos + RichJsonConstants::INHERITANCE_SIGN.size()));
            processedName = processedName.substr(0, pos);
        }

        if (isctr) {
            if (RichJsonConstants::isLateConstructor(processedName)) {
                size_t pos = processedName.find(RichJsonConstants::LATE_CONSTRUCTOR_SIGN);
                std::string className = trim(processedName.substr(pos + RichJsonConstants::LATE_CONSTRUCTOR_SIGN.size()));
                if (member.is_object()) {
                    member[RichJsonConstants::LATE_CONSTRUCTOR_MEMBER] = className;
                }
                processedName = processedName.substr(0, pos);
            } else {
                size_t pos = processedName.find(RichJsonConstants::CONSTRUCTOR_SIGN);
                std::string className = trim(processedName.substr(pos + RichJsonConstants::CONSTRUCTOR_SIGN.size()));
                try {
                    const auto& factory = RichJsonClassMapping::mapClassByName(className);
                    json instance = factory();
                    member = RichJsonHelper::mergeIntoTargetForce(instance, member);
                } catch (const std::exception& e) {
                    logger.error(std::string("Constructor error: ") + e.what());
                }
                processedName = processedName.substr(0, pos);
            }
        }

        processedName = trim(processedName);
        currentMap[processedName] = std::move(member);
        json& stored = currentMap[processedName];

        if (isite && stored.is_object()) {
            cache.inheritances[con.currentAddress + "_" + processedName] = ite;
        }

        if (!stored.is_object()) {
            throw std::runtime_error(
                "Inheritance on member '" + processedName + "' is not possible because it is not an object.");
        }
    }
}

json RichJsonParser::parseRichJsonInMember() {
    con.currentPath.push_back(con.currentName);
    std::string pathStr = joinPath(con.currentPath, RichJsonConstants::COMMAND_PATH_DELIMITER);

    auto cacheIt = cache.stack.find(con.currentAddress);
    if (cacheIt != cache.stack.end()) {
        logger.debug("cache hit at '" + pathStr + "' with address '" + con.currentAddress + "'");
        con.currentPath.pop_back();
        return cacheIt->second;
    } else {
        logger.debug("cache add at '" + pathStr + "' with address '" + con.currentAddress + "'");
        cache.stack[con.currentAddress] = con.currentMember;
    }

    if (!isMemberRichJsonAble(con.currentMember)) {
        con.currentPath.pop_back();
        return con.currentMember;
    }

    if (con.currentMember.is_string()) {
        std::string strMember = con.currentMember.get<std::string>();
        if (__RICH_JSON_CONFIG.stringInterpolationsEnabled &&
            std::regex_search(strMember, RichJsonConstants::INTERPOLATION_WILDCARD)) {
            auto res = parseInterpolations();
            con.currentMember = json(res.result);
            if (!res.isParsed) {
                con.currentPath.pop_back();
                return con.currentMember;
            }
        }
        json result = executeRichJsonCommandIfContainedInMember();
        con.currentPath.pop_back();
        return result;
    }

    std::string currentAddress = con.currentAddress;
    bool isJsonObj = con.currentMember.is_object();
    std::vector<std::string> kcmd_ignored;

    if (isJsonObj) {
        executeClone();
        callConstructor();
        cache.stack[currentAddress] = con.currentMember;
        kcmd_ignored = getIgnoresForKeyCommands();
        for (const auto& cmd : kcmd_ignored) RichJsonCommandHolder::setCommandEnabled(cmd, false);
        resolveInheritances();
        cache.stack[currentAddress] = con.currentMember;
    }

    {
        json memberCopy = con.currentMember;
        bool isRootMember = (con.currentAddress == con.rootAddress);
        json* prevRoot = con.root;
        if (isRootMember) con.root = &memberCopy;

        try {
            con.currentMember = parse(memberCopy, false);
        } catch (...) {
            con.currentMember = memberCopy;
            if (isRootMember) con.root = prevRoot;
            throw;
        }

        if (isRootMember) con.root = prevRoot;
    }

    if (isJsonObj) {
        resetCloneIfPossible(currentAddress);
        for (const auto& cmd : kcmd_ignored) RichJsonCommandHolder::setCommandEnabled(cmd, true);
        con.currentMember = executeKeyCommands();
        cache.stack[currentAddress] = con.currentMember;
    }

    con.currentPath.pop_back();
    return con.currentMember;
}

RichJsonParser::InterpolationResult RichJsonParser::parseInterpolations() {
    std::string rv;
    std::string inp = con.currentMember.get<std::string>();
    int ipnLevel = -1;
    std::vector<InterpolationData> ipns;

    for (size_t i = 0; i < inp.length(); ++i) {
        char c = inp[i];
        if (c == RichJsonConstants::INTERPOLATION_OPENING_SIGN) {
            if (i + 1 < inp.length()) {
                char nextC = inp[i + 1];
                if ((nextC == RichJsonConstants::INTERPOLATION_OPENING_SIGN ||
                     nextC == RichJsonConstants::INTERPOLATION_CLOSING_SIGN) &&
                    i + 2 < inp.length() && inp[i + 2] == RichJsonConstants::INTERPOLATION_CLOSING_SIGN) {
                    rv += nextC;
                    i += 2;
                    continue;
                }
            }
            ipnLevel++;
        } else if (c == RichJsonConstants::INTERPOLATION_CLOSING_SIGN) {
            if (ipnLevel >= 0) {
                auto& currentIpn = ipns[static_cast<size_t>(ipnLevel)];
                con.currentMember = json(currentIpn.rv);
                currentIpn.rv.clear();
                ipnLevel--;

                if (ipns.size() == static_cast<size_t>(ipnLevel + 3) && !ipns[static_cast<size_t>(ipnLevel + 2)].isParsed) {
                    con.currentMember = json(std::string(1, RichJsonConstants::INTERPOLATION_OPENING_SIGN) +
                                              con.currentMember.get<std::string>() +
                                              RichJsonConstants::INTERPOLATION_CLOSING_SIGN);
                } else {
                    con.currentMember = executeRichJsonCommandIfContainedInMember();
                }

                bool ipnParsed = !std::regex_search(con.currentMember.get<std::string>(), RichJsonConstants::COMMAND_WILDCARD);
                if (!ipnParsed) ipns[static_cast<size_t>(ipnLevel + 1)].isParsed = false;

                con.currentMember = ipnParsed
                    ? con.currentMember
                    : json(std::string(1, RichJsonConstants::INTERPOLATION_OPENING_SIGN) +
                           con.currentMember.get<std::string>() + RichJsonConstants::INTERPOLATION_CLOSING_SIGN);

                if (ipnLevel == -1) rv += con.currentMember.get<std::string>();
                else ipns[static_cast<size_t>(ipnLevel)].rv += con.currentMember.get<std::string>();
            } else {
                rv += c;
            }
        } else if (ipnLevel > -1) {
            if (ipns.size() < static_cast<size_t>(ipnLevel + 1)) ipns.push_back(InterpolationData{});
            ipns[static_cast<size_t>(ipnLevel)].rv += c;
        } else {
            rv += c;
        }
    }

    cache.stack[con.currentAddress] = json(rv);
    return InterpolationResult{rv, ipns.empty() || ipns[0].isParsed};
}

std::vector<std::string> RichJsonParser::getIgnoresForKeyCommands() {
    std::vector<std::string> rv;
    if (con.currentMember.is_object() && con.currentMember.contains(RichJsonConstants::KEY_COMMAND_MEMBER)) {
        auto kcmds = con.currentMember[RichJsonConstants::KEY_COMMAND_MEMBER].get<std::vector<std::string>>();
        for (const auto& kcmd : kcmds) {
            if (isRichJsonCommandEnabled(kcmd)) {
                auto& holder = RichJsonCommandHolder::instance();
                auto it = holder.kcmdIgnored.find(kcmd);
                if (it != holder.kcmdIgnored.end()) {
                    rv.insert(rv.end(), it->second.begin(), it->second.end());
                }
            }
        }
    }
    return rv;
}

json RichJsonParser::executeRichJsonCommandIfContainedInMember() {
    std::string strMember = con.currentMember.get<std::string>();
    if (std::regex_search(strMember, RichJsonConstants::COMMAND_WILDCARD)) {
        cache.stack[con.currentAddress] = json::object();
        size_t pos = strMember.find(RichJsonConstants::COMMAND_SUFFIX);
        con.currentCommand = strMember.substr(0, pos);
        con.currentMember = json(trim(strMember.substr(pos + 1)));
        con.currentMember = tryRichJsonCommand();
        resetCloneIfPossible(con.currentAddress);
        cache.stack[con.currentAddress] = con.currentMember;
    }
    return con.currentMember;
}

json RichJsonParser::tryRichJsonCommand() {
    try {
        con.currentPath.push_back(con.currentCommand);
        std::string unresolved_command = con.currentCommand;
        con.currentCommand = con.currentCommand.substr(1);

        std::string strMember = con.currentMember.get<std::string>();
        size_t replacePos = 0;
        while ((replacePos = strMember.find(RichJsonConstants::ARRAY_REPLACE_SUBSTRING, replacePos)) != std::string::npos) {
            strMember.replace(replacePos, RichJsonConstants::ARRAY_REPLACE_SUBSTRING.length(), RichJsonConstants::ARRAY_REPLACE_NEWSTRING);
            replacePos += RichJsonConstants::ARRAY_REPLACE_NEWSTRING.length();
        }
        con.currentMember = json(strMember);

        std::vector<std::string> pipe_commands;
        if (strMember.find(RichJsonConstants::COMMAND_PIPE_SIGN) != std::string::npos) {
            auto parts = splitAll(strMember, RichJsonConstants::COMMAND_PIPE_SIGN[0]);
            con.currentMember = json(parts[0]);
            pipe_commands.assign(parts.begin() + 1, parts.end());
        }

        auto batch_commands = splitAll(con.currentCommand, RichJsonConstants::COMMAND_PREFIX[0]);

        for (const auto& cmd : batch_commands) {
            con.currentCommand = cmd;
            if (isRichJsonCommandEnabled(con.currentCommand)) {
                if (con.currentMember.is_string() && std::regex_search(con.currentMember.get<std::string>(), RichJsonConstants::ARRAY_WILDCARD)) {
                    std::string mStr = con.currentMember.get<std::string>();
                    size_t openPos = mStr.find('[');
                    size_t closePos = mStr.find(']', openPos);
                    std::string arrayKey = trim(mStr.substr(openPos + 1, closePos - openPos - 1));
                    con.currentMember = json(mStr.substr(0, openPos));

                    json result = RichJsonCommandHolder::executeCommand(con.currentCommand, *this, con);
                    con.currentMember = RichJsonHelper::getFieldByKey(result, arrayKey);
                } else {
                    con.currentMember = RichJsonCommandHolder::executeCommand(con.currentCommand, *this, con);
                }
            } else {
                con.currentPath.pop_back();
                json rv = json(unresolved_command + RichJsonConstants::COMMAND_SUFFIX + con.currentMember.get<std::string>());
                return rv;
            }
        }

        if (!pipe_commands.empty()) {
            json* originalRoot = con.root;
            for (const auto& pipe_cmd : pipe_commands) {
                size_t pos = pipe_cmd.find(RichJsonConstants::COMMAND_SUFFIX);
                std::string cmdName = (pos == std::string::npos) ? RichJsonConstants::COMMAND_REF : trim(pipe_cmd.substr(0, pos));
                std::string memberVal = (pos == std::string::npos) ? trim(pipe_cmd) : trim(pipe_cmd.substr(pos + 1));

                json pipeRootStorage = con.currentMember;
                con.root = &pipeRootStorage;
                con.currentCommand = cmdName;
                con.currentMember = json(memberVal);
                con.currentMember = tryRichJsonCommand();
            }
            con.root = originalRoot;
        }
        con.currentPath.pop_back();
        return con.currentMember;
    } catch (const std::exception& e) {
        logger.groupEndAll();
        logger.error(e.what());
        throw std::runtime_error(
            label_ + " Command " + con.currentCommand + " could not be resolved at " +
            joinPath(con.currentPath, RichJsonConstants::COMMAND_PATH_DELIMITER));
    }
}

bool RichJsonParser::isRichJsonCommandEnabled(const std::string& command) {
    try {
        return RichJsonCommandHolder::isCommandEnabled(command);
    } catch (...) {
        logger.groupEndAll();
        throw;
    }
}

void RichJsonParser::executeClone() {
    if (con.currentMember.is_object() && con.currentMember.contains(RichJsonConstants::KEY_COMMAND_MEMBER)) {
        auto kcmds = con.currentMember[RichJsonConstants::KEY_COMMAND_MEMBER].get<std::vector<std::string>>();
        auto it = std::find(kcmds.begin(), kcmds.end(), RichJsonConstants::COMMAND_CLONE);

        if (it != kcmds.end() && isRichJsonCommandEnabled(RichJsonConstants::COMMAND_CLONE)) {
            con.currentCommand = RichJsonConstants::COMMAND_CLONE;
            con.currentMember = tryRichJsonKeyCommand();
            kcmds.erase(it);
            con.currentMember[RichJsonConstants::KEY_COMMAND_MEMBER] = kcmds;
        }
    }
}

void RichJsonParser::callConstructor() {
    if (__RICH_JSON_CONFIG.lateConstructorEnabled && con.currentMember.is_object() &&
        con.currentMember.contains(RichJsonConstants::LATE_CONSTRUCTOR_MEMBER)) {
        std::string className = con.currentMember[RichJsonConstants::LATE_CONSTRUCTOR_MEMBER].get<std::string>();
        json member = con.currentMember;
        member.erase(RichJsonConstants::LATE_CONSTRUCTOR_MEMBER);
        try {
            const auto& factory = RichJsonClassMapping::mapClassByName(className);
            json instance = factory();
            con.currentMember = RichJsonHelper::mergeIntoTargetForce(instance, member);
            logger.debug("resolved construct for '" + className + "'");
        } catch (const std::exception& e) {
            logger.error(std::string("Constructor error: ") + e.what());
        }
    }
}

void RichJsonParser::resolveInheritances() {
    auto it = cache.inheritances.find(con.currentAddress);
    if (it == cache.inheritances.end()) return;
    std::string iteStr = it->second;
    auto chain = splitAll(iteStr, RichJsonConstants::COMMAND_DELIMITER[0]);

    json member = con.currentMember;
    con.currentPath.push_back(RichJsonConstants::INHERITANCE_SIGN);

    for (auto entry : chain) {
        entry = trim(entry);
        if (std::regex_search(entry, RichJsonConstants::COMMAND_WILDCARD)) {
            size_t pos = entry.find(RichJsonConstants::COMMAND_SUFFIX);
            con.currentCommand = trim(entry.substr(0, pos));
            con.currentMember = json(trim(entry.substr(pos + 1)));
        } else {
            con.currentCommand = RichJsonConstants::COMMAND_REF;
            con.currentMember = json(entry);
        }
        json result = RichJsonHelper::cloneObject(tryRichJsonCommand());
        member = RichJsonHelper::mergeIntoTarget(member, result);
    }

    con.currentMember = member;
    con.currentPath.pop_back();
}

void RichJsonParser::resetCloneIfPossible(const std::string& address) {
    if (isCloneApplying() && address == *cache.cloneAddress) {
        cache.cloneAddress.reset();
    }
}

bool RichJsonParser::isCloneApplying() {
    return cache.cloneAddress.has_value();
}

json RichJsonParser::executeKeyCommands() {
    if (con.currentMember.is_object() && con.currentMember.contains(RichJsonConstants::KEY_COMMAND_MEMBER)) {
        auto kcmds = con.currentMember[RichJsonConstants::KEY_COMMAND_MEMBER].get<std::vector<std::string>>();
        for (size_t i = 0; i < kcmds.size();) {
            std::string command = kcmds[i];
            if (isRichJsonCommandEnabled(command)) {
                con.currentCommand = command;
                con.currentMember = tryRichJsonKeyCommand();
                kcmds.erase(kcmds.begin() + static_cast<long>(i));
            } else {
                i++;
            }
        }
        if (con.currentMember.is_object()) {
            bool keep = con.currentMember.contains(RichJsonConstants::KEEP_KEY_COMMANDS_MARKER);
            con.currentMember.erase(RichJsonConstants::KEEP_KEY_COMMANDS_MARKER);
            if (!keep) {
                if (kcmds.empty()) con.currentMember.erase(RichJsonConstants::KEY_COMMAND_MEMBER);
                else con.currentMember[RichJsonConstants::KEY_COMMAND_MEMBER] = kcmds;
            }
        }
    }
    return con.currentMember;
}

json RichJsonParser::tryRichJsonKeyCommand() {
    try {
        return RichJsonCommandHolder::executeCommand(con.currentCommand, *this, con);
    } catch (const std::exception& e) {
        logger.groupEndAll();
        logger.error(e.what());
        throw std::runtime_error("RichJson key command error: " + con.currentName);
    }
}

}
