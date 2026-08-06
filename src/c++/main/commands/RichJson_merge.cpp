#include "RichJson_merge.hpp"
#include "../core/RichJsonCommandHolder.hpp"
#include "../core/RichJsonConstants.hpp"
#include "../core/RichJsonContext.hpp"
#include "../helper/RichJsonHelper.hpp"

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

json richJson_merge(RichJsonParser& parser, RichJsonContext& context) {
    auto refs = splitAll(context.currentMember.get<std::string>(), RichJsonConstants::COMMAND_DELIMITER[0]);
    std::string originalAddress = context.currentAddress;

    context.currentMember = json(trim(refs[0]));
    context.currentMember = RichJsonCommandHolder::executeCommand("ref", parser, context);
    context.currentAddress = originalAddress;

    if (context.currentMember.is_object()) {
        json target = json::object();
        target = RichJsonHelper::mergeIntoTarget(target, context.currentMember);

        for (size_t i = 1; i < refs.size(); ++i) {
            context.currentMember = json(trim(refs[i]));
            json nextRef = RichJsonCommandHolder::executeCommand("ref", parser, context);
            context.currentAddress = originalAddress;
            target = RichJsonHelper::mergeIntoTarget(target, nextRef);
        }
        return target;
    }

    json target = json::array();
    for (size_t i = 0; i < refs.size(); ++i) {
        context.currentMember = json(trim(refs[i]));
        json nextRef = RichJsonCommandHolder::executeCommand("ref", parser, context);
        context.currentAddress = originalAddress;
        if (nextRef.is_array()) {
            for (const auto& el : nextRef) target.push_back(el);
        }
    }
    return target;
}

}
