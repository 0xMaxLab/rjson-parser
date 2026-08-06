#ifndef RICH_JSON_COMMAND_COPY_HPP
#define RICH_JSON_COMMAND_COPY_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

json richJson_copy(RichJsonParser& parser, RichJsonContext& context);

}

#endif
