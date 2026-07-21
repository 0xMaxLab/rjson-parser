#ifndef RICH_JSON_COMMAND_ENV_HPP
#define RICH_JSON_COMMAND_ENV_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

// Ported from commands/RichJson_env.java.
json richJson_env(RichJsonParser& parser, RichJsonContext& context);

} // namespace RichJson

#endif
