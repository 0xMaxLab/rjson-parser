#include "RichJson_invoke.hpp"
#include "../core/RichJsonContext.hpp"
#include "../other/RichJsonEnvironment.hpp"

namespace RichJson {

json richJson_invoke(RichJsonParser&, RichJsonContext& context) {
    if (context.currentMember.is_object() &&
        context.currentMember.contains(RichJsonEnvironment::NATIVE_FUNCTION_MEMBER)) {
        std::string fnName = context.currentMember[RichJsonEnvironment::NATIVE_FUNCTION_MEMBER].get<std::string>();
        auto& functions = RichJsonEnvironment::functions();
        auto it = functions.find(fnName);
        if (it != functions.end()) {
            return it->second();
        }
    }

    return context.currentMember;
}

}
