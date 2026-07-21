#include "RichJson_copy.hpp"
#include "../core/RichJsonCommandHolder.hpp"
#include "../helper/RichJsonHelper.hpp"

namespace RichJson {

json richJson_copy(RichJsonParser& parser, RichJsonContext& context) {
    json referencedValue = RichJsonCommandHolder::executeCommand("ref", parser, context);
    return RichJsonHelper::cloneObject(referencedValue);
}

} // namespace RichJson
