#ifndef RICH_JSON_COMMAND_HPP
#define RICH_JSON_COMMAND_HPP

#include <nlohmann/json.hpp>
#include <functional>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

using RichJsonCommand = std::function<json(RichJsonParser&, RichJsonContext&)>;

}

#endif
