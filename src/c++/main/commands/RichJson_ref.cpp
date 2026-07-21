#include "RichJson_ref.hpp"
#include "../core/RichJsonConstants.hpp"
#include "../core/RichJsonContext.hpp"
#include "../core/RichJsonParser.hpp"
#include <stdexcept>

namespace RichJson {

namespace {

std::vector<std::string> splitPath(const std::string& s, char delim) {
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

std::string joinPath(const std::vector<std::string>& path) {
    std::string s;
    for (size_t i = 0; i < path.size(); ++i) {
        s += path[i];
        if (i + 1 < path.size()) s += RichJsonConstants::COMMAND_PATH_DELIMITER;
    }
    return s;
}

} // namespace

json richJson_resolvePathFrom(json* startNode, const std::string& startAddress, RichJsonParser& parser, RichJsonContext& context) {
    json* prevMember = startNode;
    std::string runningAddress = startAddress;
    std::string originalAddress = context.currentAddress;
    std::string pathStr = context.currentMember.get<std::string>();
    auto refs = splitPath(pathStr, RichJsonConstants::COMMAND_PATH_DELIMITER[0]);

    for (const auto& ref : refs) {
        if (!prevMember->is_object()) {
            throw std::runtime_error("Cannot resolve member '" + ref + "' because parent is not an object.");
        }

        auto it = prevMember->find(ref);
        if (it == prevMember->end()) {
            throw std::runtime_error("Member '" + ref + "' at '" + joinPath(context.currentPath) + "' does not exist");
        }

        json& memberRef = *it;
        context.currentMember = memberRef;

        runningAddress = runningAddress + "_" + ref;
        context.currentAddress = runningAddress;

        context.currentMember = parser.parseRichJsonInMember();
        memberRef = context.currentMember; // persist resolution into the actual tree slot

        context.currentPath.push_back(ref);
        prevMember = &memberRef;
    }

    context.currentAddress = originalAddress;
    for (size_t i = 0; i < refs.size(); ++i) context.currentPath.pop_back();
    return context.currentMember;
}

json richJson_ref(RichJsonParser& parser, RichJsonContext& context) {
    if (context.currentMember.is_null() ||
        (context.currentMember.is_string() && context.currentMember.get<std::string>().empty())) {
        return *context.root;
    }

    return richJson_resolvePathFrom(context.root, context.rootAddress, parser, context);
}

} // namespace RichJson
