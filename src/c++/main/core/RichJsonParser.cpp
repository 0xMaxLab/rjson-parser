#include "RichJsonParser.hpp"
#include "../helper/RichJsonHelper.hpp"

RichJsonParser::RichJsonParser() : logger("RichJSON (PID " + std::to_string(++NEXT_ID) + "):") {
    this->id = NEXT_ID;
    this->label = "RichJSON (PID " + std::to_string(this->id) + "):";
}

Dynamic RichJsonParser::parse(Dynamic current, bool isRoot) {
    if (isRoot) {
        this->logger.info("is going to be applied...");
        this->logger.groupStart();
        this->logger.timeStart();

        this->con.root = current;
        this->con.current = current;
        this->con.currentName = "root";
        this->con.currentMember = current;
        this->con.currentAddress = this->cache.resolveAddress(current);

        Dynamic result = this->__parseRichJsonInMember();

        this->cache.level--;
        this->logger.groupEndAll();

        if (this->cache.level == -1) {
            this->logger.info("was applied successfully.");
        } else {
            this->logger.error("was not applied successfully.");
        }
        this->logger.timeEnd();
        return result;
    }

    this->con.current = current;
    std::string pathStr = joinPath(this->con.currentPath, RichJsonConstants::COMMAND_PATH_DELIMITER);
    this->logger.debug("step into level " + std::to_string(this->cache.level) + " at '" + pathStr + "'");
    this->logger.groupStart();
    this->cache.level++;

    bool isJsonObj = current.isMap();
    std::string currentName = this->con.currentName;
    std::string currentAddress = this->con.currentAddress;

    if (isJsonObj) {
        this->__preprocess_kcommands_constructors_inheritances();
        auto& map = current.asMap();
        auto sortedKeys = RichJsonHelper::getKeysSorted(current);

        for (const auto& name : sortedKeys) {
            auto member = map[name];
            this->con.currentMember = member;

            bool isContainer = member.isMap() || member.isList();
            this->con.currentAddress = isContainer 
                ? this->cache.resolveAddress(member) 
                : currentAddress + "_" + name;

            this->con.currentName = name;
            this->con.currentMember = this->__parseRichJsonInMember();
            map[name] = this->con.currentMember;
        }
    } else if (current.isList()) {
        auto& list = current.asList();
        for (size_t i = 0; i < list.size(); i++) {
            auto member = list[i];
            this->con.currentMember = member;

            bool isContainer = member.isMap() || member.isList();
            this->con.currentAddress = isContainer 
                ? this->cache.resolveAddress(member) 
                : currentAddress + "_" + std::to_string(i);

            this->con.currentName = currentName + "[" + std::to_string(i) + "]";
            this->con.currentMember = this->__parseRichJsonInMember();
            list[i] = this->con.currentMember;
        }
    }

    this->cache.level--;
    this->logger.groupEnd();
    this->logger.debug("step out of level " + std::to_string(this->cache.level) + " at '" + pathStr + "'");
    return current;
}

void RichJsonParser::__preprocess_kcommands_constructors_inheritances() {
    auto& currentMap = this->con.current.asMap();
    std::vector<std::string> names;
    for (const auto& [k, v] : currentMap) names.push_back(k);

    for (const auto& name : names) {
        bool iscmd = RichJsonConstants::isCommand(name);
        bool isctr = RichJsonConstants::isConstructor(name);
        bool isite = RichJsonConstants::isInheritance(name);

        if (iscmd || isctr || isite) {
            auto member = currentMap[name];
            currentMap.erase(name);
            std::string processedName = name;

            if (iscmd) {
                size_t pos = processedName.find(RichJsonConstants::COMMAND_SUFFIX);
                std::string cmdPart = processedName.substr(0, pos);
                processedName = processedName.substr(pos + 1);

                std::vector<std::string> kcmdList;
                std::stringstream ss(cmdPart.substr(1));
                std::string item;
                while (std::getline(ss, item, RichJsonConstants::COMMAND_PREFIX[0])) {
                    kcmdList.push_back(item);
                }

                if (member.isMap()) {
                    member.asMap()[RichJsonConstants::KEY_COMMAND_MEMBER] = Dynamic{kcmdList};
                }
            }

            std::string ite = "";
            if (isite) {
                size_t pos = processedName.find(RichJsonConstants::INHERITANCE_SIGN);
                ite = processedName.substr(pos + 1);
                processedName = processedName.substr(0, pos);
            }

            if (isctr) {
                if (RichJsonConstants::isLateConstructor(processedName)) {
                    size_t pos = processedName.find(RichJsonConstants::LATE_CONSTRUCTOR_SIGN);
                    std::string className = processedName.substr(pos + 1);
                    if (member.isMap()) {
                        member.asMap()[RichJsonConstants::LATE_CONSTRUCTOR_MEMBER] = Dynamic{className};
                    }
                    processedName = processedName.substr(0, pos);
                } else {
                    size_t pos = processedName.find(RichJsonConstants::CONSTRUCTOR_SIGN);
                    std::string className = processedName.substr(pos + 1);
                    
                    DynamicMap instanceMap = RichJsonClassMapping::createInstance(className);
                    member = RichJsonHelper::__mergeIntoTarget(RichJsonCache(), instanceMap, member.asMap(), true);
                    processedName = processedName.substr(0, pos);
                }
            }

            if (isite && member.isMap()) {
                this->cache.inheritances[this->cache.resolveAddress(member)] = ite;
            }

            currentMap[processedName] = member;
            if (!member.isMap()) {
                throw std::runtime_error("Inheritance on member '" + processedName + "' is not possible because it is not an object.");
            }
        }
    }
}

Dynamic RichJsonParser::__parseRichJsonInMember() {
    this->con.currentPath.push_back(this->con.currentName);
    std::string pathStr = joinPath(this->con.currentPath, RichJsonConstants::COMMAND_PATH_DELIMITER);

    if (this->cache.stack.find(this->con.currentAddress) != this->cache.stack.end()) {
        this->logger.debug("cache hit at '" + pathStr + "' with address '" + this->con.currentAddress + "'");
        this->con.currentPath.pop_back();
        return this->cache.stack[this->con.currentAddress];
    } else {
        this->logger.debug("cache add at '" + pathStr + "' with address '" + this->con.currentAddress + "'");
        this->cache.stack[this->con.currentAddress] = this->con.currentMember;
    }

    if (!__isMemberRichJsonAble(this->con.currentMember)) {
        this->con.currentPath.pop_back();
        return this->con.currentMember;
    }

    if (this->con.currentMember.isString()) {
        auto strMember = this->con.currentMember.asString();
        if (RichJsonConfig::stringInterpolationsEnabled && std::regex_search(strMember, RichJsonConstants::INTERPOLATION_WILDCARD)) {
            auto res = __parseInterpolations();
            this->con.currentMember = Dynamic{res.result};
            if (!res.isParsed) {
                this->con.currentPath.pop_back();
                return this->con.currentMember;
            }
        }
        Dynamic result = __executeRichJsonCommandIfContainedInMember();
        this->con.currentPath.pop_back();
        return result;
    } else {
        std::string currentAddress = this->con.currentAddress;
        bool isJsonObj = this->con.currentMember.isMap();
        std::vector<std::string> kcmd_ignored;

        if (isJsonObj) {
            __executeClone();
            __callConstructor();
            this->cache.stack[currentAddress] = this->con.currentMember;
            kcmd_ignored = __getIgnoresForKeyCommands();
            for (const auto& cmd : kcmd_ignored) RichJsonCommandHolder::setCommandEnabled(cmd, false);
            __resolveInheritances();
        }

        this->con.currentMember = this->parse(this->con.currentMember, false);

        if (isJsonObj) {
            __resetCloneIfPossible(currentAddress);
            for (const auto& cmd : kcmd_ignored) RichJsonCommandHolder::setCommandEnabled(cmd, true);
            this->con.currentMember = __executeKeyCommands();
        }

        this->con.currentPath.pop_back();
        return this->con.currentMember;
    }
}

bool RichJsonParser::__isMemberRichJsonAble(const Dynamic& member) {
    return member.isString() || member.isList() || member.isMap();
}

RichJsonParser::InterpolationResult RichJsonParser::__parseInterpolations() {
    std::stringstream rv;
    std::string inp = this->con.currentMember.asString();
    int ipnLevel = -1;
    std::vector<InterpolationData> ipns;

    for (size_t i = 0; i < inp.length(); ++i) {
        char c = inp[i];
        if (c == RichJsonConstants::INTERPOLATION_OPENING_SIGN) {
            if (i + 1 < inp.length()) {
                char nextC = inp[i + 1];
                if ((nextC == RichJsonConstants::INTERPOLATION_OPENING_SIGN || nextC == RichJsonConstants::INTERPOLATION_CLOSING_SIGN) &&
                    i + 2 < inp.length() && inp[i + 2] == RichJsonConstants::INTERPOLATION_CLOSING_SIGN) {
                    rv << nextC;
                    i += 2;
                    continue;
                }
            }
            ipnLevel++;
        } else if (c == RichJsonConstants::INTERPOLATION_CLOSING_SIGN) {
            if (ipnLevel >= 0) {
                auto& currentIpn = ipns[ipnLevel];
                this->con.currentMember = Dynamic{currentIpn.rv.str()};
                currentIpn.rv.str("");
                ipnLevel--;

                if (ipns.size() == static_cast<size_t>(ipnLevel + 3) && !ipns[ipnLevel + 2].isParsed) {
                    this->con.currentMember = Dynamic{std::string(1, RichJsonConstants::INTERPOLATION_OPENING_SIGN) + this->con.currentMember.asString() + RichJsonConstants::INTERPOLATION_CLOSING_SIGN};
                } else {
                    this->con.currentMember = __executeRichJsonCommandIfContainedInMember();
                }

                bool ipnParsed = !std::regex_search(this->con.currentMember.asString(), RichJsonConstants::COMMAND_WILDCARD);
                if (!ipnParsed) ipns[ipnLevel + 1].isParsed = false;

                this->con.currentMember = ipnParsed ? this->con.currentMember : Dynamic{std::string(1, RichJsonConstants::INTERPOLATION_OPENING_SIGN) + this->con.currentMember.asString() + RichJsonConstants::INTERPOLATION_CLOSING_SIGN};

                if (ipnLevel == -1) rv << this->con.currentMember.asString();
                else ipns[ipnLevel].rv << this->con.currentMember.asString();
            } else {
                rv << c;
            }
        } else if (ipnLevel > -1) {
            if (ipns.size() < static_cast<size_t>(ipnLevel + 1)) ipns.push_back(InterpolationData{});
            ipns[ipnLevel].rv << c;
        } else {
            rv << c;
        }
    }
    std::string finalResult = rv.str();
    this->cache.stack[this->con.currentAddress] = Dynamic{finalResult};
    return InterpolationResult{finalResult, ipns.empty() || ipns[0].isParsed};
}

std::vector<std::string> RichJsonParser::__getIgnoresForKeyCommands() {
    std::vector<std::string> rv;
    if (this->con.currentMember.isMap()) {
        auto& map = this->con.currentMember.asMap();
        if (map.find(RichJsonConstants::KEY_COMMAND_MEMBER) != map.end()) {
            auto kcmds = std::any_cast<std::vector<std::string>>(map.at(RichJsonConstants::KEY_COMMAND_MEMBER).value);
            for (const auto& kcmd : kcmds) {
                if (__isRichJsonCommandEnabled(kcmd)) {
                    if (RichJsonCommandHolder::INSTANCE.kcmdIgnored.find(kcmd) != RichJsonCommandHolder::INSTANCE.kcmdIgnored.end()) {
                        auto ignored = RichJsonCommandHolder::INSTANCE.kcmdIgnored[kcmd];
                        rv.insert(rv.end(), ignored.begin(), ignored.end());
                    }
                }
            }
        }
    }
    return rv;
}

Dynamic RichJsonParser::__executeRichJsonCommandIfContainedInMember() {
    std::string strMember = this->con.currentMember.asString();
    if (std::regex_search(strMember, RichJsonConstants::COMMAND_WILDCARD)) {
        this->cache.stack[this->con.currentAddress] = Dynamic{DynamicMap{}};
        size_t pos = strMember.find(RichJsonConstants::COMMAND_SUFFIX);
        this->con.currentCommand = strMember.substr(0, pos);
        this->con.currentMember = Dynamic{strMember.substr(pos + 1)};
        this->con.currentMember = __tryRichJsonCommand();
        __resetCloneIfPossible(this->con.currentAddress);
        this->cache.stack[this->con.currentAddress] = this->con.currentMember;
    }
    return this->con.currentMember;
}

Dynamic RichJsonParser::__tryRichJsonCommand() {
    try {
        this->con.currentPath.push_back(this->con.currentCommand);
        std::string unresolved_command = this->con.currentCommand;
        this->con.currentCommand = this->con.currentCommand.substr(1);
        
        std::string strMember = this->con.currentMember.asString();
        size_t replacePos = 0;
        while ((replacePos = strMember.find(RichJsonConstants::ARRAY_REPLACE_SUBSTRING, replacePos)) != std::string::npos) {
            strMember.replace(replacePos, RichJsonConstants::ARRAY_REPLACE_SUBSTRING.length(), RichJsonConstants::ARRAY_REPLACE_NEWSTRING);
            replacePos += RichJsonConstants::ARRAY_REPLACE_NEWSTRING.length();
        }
        this->con.currentMember = Dynamic{strMember};

        std::vector<std::string> pipe_commands;
        if (this->con.currentMember.asString().find(RichJsonConstants::COMMAND_PIPE_SIGN) != std::string::npos) {
            std::stringstream ss(this->con.currentMember.asString());
            std::string item;
            std::getline(ss, item, RichJsonConstants::COMMAND_PIPE_SIGN[0]);
            this->con.currentMember = Dynamic{item};
            while (std::getline(ss, item, RichJsonConstants::COMMAND_PIPE_SIGN[0])) {
                pipe_commands.push_back(item);
            }
        }

        std::vector<std::string> batch_commands;
        std::stringstream ssBatch(this->con.currentCommand);
        std::string batchItem;
        while (std::getline(ssBatch, batchItem, RichJsonConstants::COMMAND_PREFIX[0])) {
            batch_commands.push_back(batchItem);
        }

        for (const auto& cmd : batch_commands) {
            this->con.currentCommand = cmd;
            if (__isRichJsonCommandEnabled(this->con.currentCommand)) {
                if (this->con.currentMember.isString() && std::regex_search(this->con.currentMember.asString(), RichJsonConstants::ARRAY_WILDCARD)) {
                    std::string mStr = this->con.currentMember.asString();
                    size_t openBracket = mStr.find('[');
                    size_t closeBracket = mStr.find(']');
                    std::string arrayKey = mStr.substr(openBracket + 1, closeBracket - openBracket - 1);
                    this->con.currentMember = Dynamic{mStr.substr(0, openBracket)};
                    
                    Dynamic result = RichJsonCommandHolder::executeCommand(this->con.currentCommand, this, this->con);
                    this->con.currentMember = RichJsonHelper::getFieldByKey(result, arrayKey);
                } else {
                    this->con.currentMember = RichJsonCommandHolder::executeCommand(this.con.currentCommand, this, this->con);
                }
            } else {
                return Dynamic{unresolved_command + this->con.currentMember.asString()};
            }
        }

        if (!pipe_commands.empty()) {
            Dynamic originalRoot = this->con.root;
            for (const auto& pipe_cmd : pipe_commands) {
                size_t pos = pipe_cmd.find(RichJsonConstants::COMMAND_SUFFIX);
                std::string cmdName = (pos == std::string::npos) ? RichJsonConstants::COMMAND_REF : pipe_cmd.substr(0, pos);
                std::string memberVal = (pos == std::string::npos) ? pipe_cmd : pipe_cmd.substr(pos + 1);

                this->con.root = this->con.currentMember;
                this->con.currentCommand = cmdName;
                this->con.currentMember = Dynamic{memberVal};
                this->con.currentMember = __tryRichJsonCommand();
            }
            this->con.root = originalRoot;
        }
        this->con.currentPath.pop_back();
        return this->con.currentMember;
    } catch (const std::exception& e) {
        this->logger.groupEndAll();
        this->logger.error(e.what());
        throw std::runtime_error(this->label + " Command " + this->con.currentCommand + " could not be resolved at " + joinPath(this->con.currentPath, RichJsonConstants::COMMAND_PATH_DELIMITER));
    }
}

bool RichJsonParser::__isRichJsonCommandEnabled(const std::string& command) {
    try {
        return RichJsonCommandHolder::isCommandEnabled(command);
    } catch (...) {
        this->logger.groupEndAll();
        throw;
    }
}

void RichJsonParser::__executeClone() {
    if (this->con.currentMember.isMap()) {
        auto& map = this->con.currentMember.asMap();
        if (map.find(RichJsonConstants::KEY_COMMAND_MEMBER) != map.end()) {
            auto kcmds = std::any_cast<std::vector<std::string>>(map[RichJsonConstants::KEY_COMMAND_MEMBER].value);
            auto it = std::find(kcmds.begin(), kcmds.end(), RichJsonConstants::COMMAND_CLONE);

            if (it != kcmds.end() && __isRichJsonCommandEnabled(RichJsonConstants::COMMAND_CLONE)) {
                this->con.currentCommand = RichJsonConstants::COMMAND_CLONE;
                this->con.currentMember = __tryRichJsonKeyCommand();
                kcmds.erase(it);
                this->con.currentMember.asMap()[RichJsonConstants::KEY_COMMAND_MEMBER] = Dynamic{kcmds};
            }
        }
    }
}

void RichJsonParser::__callConstructor() {
    if (RichJsonConfig::lateConstructorEnabled && this->con.currentMember.isMap()) {
        auto& map = this->con.currentMember.asMap();
        if (map.find(RichJsonConstants::LATE_CONSTRUCTOR_MEMBER) != map.end()) {
            std::string className = map[RichJsonConstants::LATE_CONSTRUCTOR_MEMBER].asString();
            map.erase(RichJsonConstants::LATE_CONSTRUCTOR_MEMBER);
            try {
                DynamicMap instanceMap = RichJsonClassMapping::createInstance(className);
                // C++ Äquivalent zu mappers updateValue/convertValue via Map-Merging
                for (const auto& [k, v] : map) instanceMap[k] = v;
                this->con.currentMember = Dynamic{instanceMap};
                this->logger.debug("resolved construct for '" + className + "'");
            } catch (const std::exception& e) {
                this->logger.error(std::string("Constructor error: ") + e.what());
            }
        }
    }
}

void RichJsonParser::__resolveInheritances() {
    if (this->cache.inheritances.find(this->con.currentAddress) == this->cache.inheritances.end()) return;
    std::string iteStr = this->cache.inheritances[this->con.currentAddress];

    std::vector<std::string> chain;
    std::stringstream ss(iteStr);
    std::string entry;
    while (std::getline(ss, entry, ',')) chain.push_back(entry);

    auto& member = this->con.currentMember.asMap();
    this->con.currentPath.push_back(RichJsonConstants::INHERITANCE_SIGN);
    
    for (const auto& item : chain) {
        if (std::regex_search(item, RichJsonConstants::COMMAND_WILDCARD)) {
            size_t pos = item.find(RichJsonConstants::COMMAND_SUFFIX);
            this->con.currentCommand = item.substr(0, pos);
            this->con.currentMember = Dynamic{item.substr(pos + 1)};
        } else {
            this->con.currentCommand = RichJsonConstants::COMMAND_REF;
            this->con.currentMember = Dynamic{item};
        }
        Dynamic result = RichJsonHelper::cloneObject(this.__tryRichJsonCommand());
        this->con.currentMember = RichJsonHelper::mergeIntoTarget(member, result);
    }
    this->con.currentPath.pop_back();
}

void RichJsonParser::__resetCloneIfPossible(const std::string& address) {
    if (this->__isCloneApplying() && address == this->cache.cloneAddress) {
        this->cache.cloneAddress = "";
    }
}

bool RichJsonParser::__isCloneApplying() {
    return !this->cache.cloneAddress.empty();
}

Dynamic RichJsonParser::__executeKeyCommands() {
    if (this->con.currentMember.isMap()) {
        auto& map = this->con.currentMember.asMap();
        if (map.find(RichJsonConstants::KEY_COMMAND_MEMBER) != map.end()) {
            auto kcmds = std::any_cast<std::vector<std::string>>(map[RichJsonConstants::KEY_COMMAND_MEMBER].value);
            for (auto it = kcmds.begin(); it != kcmds.end();) {
                std::string command = *it;
                if (__isRichJsonCommandEnabled(command)) {
                    this->con.currentCommand = command;
                    this->con.currentMember = __tryRichJsonKeyCommand();
                    it = kcmds.erase(it);
                } else {
                    ++it;
                }
            }
            if (this->con.currentMember.isMap()) {
                auto& resMap = this->con.currentMember.asMap();
                if (kcmds.empty()) resMap.erase(RichJsonConstants::KEY_COMMAND_MEMBER);
                else resMap[RichJsonConstants::KEY_COMMAND_MEMBER] = Dynamic{kcmds};
            }
        }
    }
    return this->con.currentMember;
}

Dynamic RichJsonParser::__tryRichJsonKeyCommand() {
    try {
        return RichJsonCommandHolder::executeCommand(this->con.currentCommand, this, this->con);
    } catch (const std::exception& e) {
        this->logger.groupEndAll();
        this->logger.error(e.what());
        throw std::runtime_error("RichJson key command error: " + this->con.currentName);
    }
}