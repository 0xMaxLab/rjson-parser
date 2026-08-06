#include "RichJson_file.hpp"
#include "../core/RichJsonContext.hpp"
#include "../helper/RichJsonFileHelper.hpp"

namespace RichJson {

json richJson_file(RichJsonParser&, RichJsonContext& context) {
    std::string fileName = context.currentMember.get<std::string>() + ".json";
    return RichJsonFileHelper::readFile(fileName, true);
}

}
