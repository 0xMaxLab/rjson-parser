#ifndef RICH_JSON_COMMAND_THIS_HPP
#define RICH_JSON_COMMAND_THIS_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

// Ported from commands/RichJson_this.java.
json richJson_this(RichJsonParser& parser, RichJsonContext& context);

} // namespace RichJson

#endif
