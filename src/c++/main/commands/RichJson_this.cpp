#include "RichJson_this.hpp"
#include "RichJson_ref.hpp"
#include "../core/RichJsonContext.hpp"

namespace RichJson {

json richJson_this(RichJsonParser& parser, RichJsonContext& context) {
    if (context.currentMember.is_null() ||
        (context.currentMember.is_string() &&
         (context.currentMember.get<std::string>().empty() || context.currentMember.get<std::string>() == "this"))) {
        return *context.current;
    }

    return richJson_resolvePathFrom(context.current, context.containerAddress, parser, context);
}

} // namespace RichJson
