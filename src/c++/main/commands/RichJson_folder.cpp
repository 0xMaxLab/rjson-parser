#include "RichJson_folder.hpp"
#include "../core/RichJsonContext.hpp"
#include "../helper/RichJsonFileHelper.hpp"

namespace RichJson {

json richJson_folder(RichJsonParser&, RichJsonContext& context) {
    std::string folderPath = context.currentMember.get<std::string>();
    return RichJsonFileHelper::readDirectory(folderPath, true);
}

} // namespace RichJson
