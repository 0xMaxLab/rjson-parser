#ifndef RICH_JSON_COMMAND_HPP
#define RICH_JSON_COMMAND_HPP

#include <nlohmann/json.hpp>
#include <functional>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

// Ported from core/RichJsonCommand.java (a @FunctionalInterface). Kept as a
// lightweight alias (forward-declaring RichJsonParser/RichJsonContext) so
// that headers needing only the command *type* (RichJsonCommandHolder,
// RichJsonModule) don't have to include the full parser.
using RichJsonCommand = std::function<json(RichJsonParser&, RichJsonContext&)>;

} // namespace RichJson

#endif
