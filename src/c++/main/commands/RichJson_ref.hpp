#ifndef RICH_JSON_COMMAND_REF_HPP
#define RICH_JSON_COMMAND_REF_HPP

#include <nlohmann/json.hpp>
#include <string>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

json richJson_ref(RichJsonParser& parser, RichJsonContext& context);

json richJson_resolvePathFrom(json* startNode, const std::string& startAddress, RichJsonParser& parser, RichJsonContext& context);

}

#endif
