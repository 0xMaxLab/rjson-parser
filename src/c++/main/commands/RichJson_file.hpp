#ifndef RICH_JSON_COMMAND_FILE_HPP
#define RICH_JSON_COMMAND_FILE_HPP

#include <nlohmann/json.hpp>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

// Ported from commands/RichJson_file.java.
json richJson_file(RichJsonParser& parser, RichJsonContext& context);

} // namespace RichJson

#endif
