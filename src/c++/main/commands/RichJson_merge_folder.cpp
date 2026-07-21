#include "RichJson_merge_folder.hpp"
#include "../core/RichJsonCommandHolder.hpp"
#include "../core/RichJsonContext.hpp"
#include "../helper/RichJsonHelper.hpp"

namespace RichJson {

json richJson_merge_folder(RichJsonParser& parser, RichJsonContext& context) {
    json folderContent = RichJsonCommandHolder::executeCommand("folder", parser, context);
    auto sortedKeys = RichJsonHelper::getKeysSorted(folderContent);

    json result = json::object();
    for (const auto& key : sortedKeys) {
        const json& content = folderContent.at(key);
        if (content.is_object()) {
            result = RichJsonHelper::mergeIntoTarget(result, content);
        }
    }
    return result;
}

} // namespace RichJson
