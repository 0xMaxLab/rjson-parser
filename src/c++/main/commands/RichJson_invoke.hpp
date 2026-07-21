#ifndef RICH_JSON_COMMAND_INVOKE_HPP
#define RICH_JSON_COMMAND_INVOKE_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

// Ported from commands/RichJson_invoke.java. Since JSON values can't hold
// executable code, this recognizes the native-function sentinel produced by
// $env (see RichJsonEnvironment) and calls the registered function; on any
// other value it's a pass-through no-op.
json richJson_invoke(RichJsonParser& parser, RichJsonContext& context);

} // namespace RichJson

#endif
