#ifndef RICH_JSON_COMMAND_THIS_HPP
#define RICH_JSON_COMMAND_THIS_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

json richJson_this(RichJsonParser& parser, RichJsonContext& context);

}

#endif
