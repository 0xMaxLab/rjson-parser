#ifndef RICH_JSON_COMMAND_MERGE_FOLDER_HPP
#define RICH_JSON_COMMAND_MERGE_FOLDER_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

json richJson_merge_folder(RichJsonParser& parser, RichJsonContext& context);

}

#endif
