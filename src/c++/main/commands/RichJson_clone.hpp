#ifndef RICH_JSON_COMMAND_CLONE_HPP
#define RICH_JSON_COMMAND_CLONE_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

json richJson_clone(RichJsonParser& parser, RichJsonContext& context);

}

#endif
