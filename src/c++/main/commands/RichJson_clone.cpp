#include "RichJson_clone.hpp"
#include "../core/RichJsonConstants.hpp"
#include "../core/RichJsonContext.hpp"
#include "../core/RichJsonParser.hpp"
#include "../helper/RichJsonHelper.hpp"
#include "../other/RichJsonConfig.hpp"
#include <stdexcept>

namespace RichJson {

namespace {
std::string joinPath(const std::vector<std::string>& path) {
    std::string s;
    for (size_t i = 0; i < path.size(); ++i) {
        s += path[i];
        if (i + 1 < path.size()) s += RichJsonConstants::COMMAND_PATH_DELIMITER;
    }
    return s;
}
} // namespace

json richJson_clone(RichJsonParser& parser, RichJsonContext& context) {
    if (parser.cache.cloneAddress.has_value()) {
        if (__RICH_JSON_CONFIG.crashOnNestedCloneEnabled) {
            throw std::runtime_error("RichJSON nested clone detected at '" + joinPath(context.currentPath) + "'.");
        }
        return context.currentMember;
    }

    parser.cache.cloneAddress = context.currentAddress;
    context.currentMember = RichJsonHelper::cloneObject(context.currentMember);

    parser.logger.debug("resolved clone at '" + joinPath(context.currentPath) + "'.");
    return context.currentMember;
}

}
