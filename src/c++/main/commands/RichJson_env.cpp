#include "RichJson_env.hpp"
#include "../core/RichJsonCommandHolder.hpp"
#include "../core/RichJsonConstants.hpp"
#include "../core/RichJsonContext.hpp"
#include "../core/RichJsonParser.hpp"
#include "../other/RichJsonEnvironment.hpp"
#include <stdexcept>

namespace RichJson {

json richJson_env(RichJsonParser& parser, RichJsonContext& context) {
    if (context.currentMember.is_object()) {
        RichJsonEnvironment::addEnvironmentVariables(context.currentMember);
        return context.currentMember;
    }

    std::string memberStr = context.currentMember.get<std::string>();
    size_t slashPos = memberStr.find(RichJsonConstants::COMMAND_PATH_DELIMITER);
    bool hasRemainder = slashPos != std::string::npos;
    std::string firstRef = hasRemainder ? memberStr.substr(0, slashPos) : memberStr;
    std::string remainder = hasRemainder ? memberStr.substr(slashPos + RichJsonConstants::COMMAND_PATH_DELIMITER.size()) : "";

    if (RichJsonEnvironment::hasFunction(firstRef)) {
        if (hasRemainder) {
            throw std::runtime_error("RichJson native function '" + firstRef + "' does not support path navigation.");
        }
        json sentinel = json::object();
        sentinel[RichJsonEnvironment::NATIVE_FUNCTION_MEMBER] = firstRef;
        return sentinel;
    }

    if (!RichJsonEnvironment::hasEnv(firstRef)) {
        throw std::runtime_error("Environment variable or path '" + memberStr + "' does not exist.");
    }

    json& envVal = RichJsonEnvironment::env().at(firstRef);
    context.currentMember = envVal;

    json* prevRoot = context.root;
    std::string prevRootAddress = context.rootAddress;
    json emptyRoot = json::object();
    context.root = envVal.is_object() ? &envVal : &emptyRoot;
    context.rootAddress = "env_" + firstRef;
    context.currentAddress = context.rootAddress;

    context.currentMember = parser.parseRichJsonInMember();
    envVal = context.currentMember;

    json result = context.currentMember;
    if (hasRemainder) {
        context.currentMember = json(remainder);
        result = RichJsonCommandHolder::executeCommand("ref", parser, context);
    }

    context.root = prevRoot;
    context.rootAddress = prevRootAddress;
    return result;
}

}
