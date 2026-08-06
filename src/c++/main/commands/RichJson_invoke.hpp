#ifndef RICH_JSON_COMMAND_INVOKE_HPP
#define RICH_JSON_COMMAND_INVOKE_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

json richJson_invoke(RichJsonParser& parser, RichJsonContext& context);

}

#endif
