#ifndef RICH_JSON_COMMAND_REF_HPP
#define RICH_JSON_COMMAND_REF_HPP

#include <nlohmann/json.hpp>
#include <string>

namespace RichJson {

using json = nlohmann::json;

class RichJsonParser;
struct RichJsonContext;

// Ported from commands/RichJson_ref.java.
json richJson_ref(RichJsonParser& parser, RichJsonContext& context);

// Shared with RichJson_this (Java: RichJson_this extends RichJson_ref and
// reuses its protected resolvePathFrom). `startNode` is the node to resolve
// the path segments from (context.root for $ref, context.current for $this).
// `startAddress` is the compositional (path-based) address anchor for
// `startNode` (context.rootAddress / context.containerAddress respectively)
// - see the RichJsonContext comment for why this can't be derived from
// startNode's pointer.
json richJson_resolvePathFrom(json* startNode, const std::string& startAddress, RichJsonParser& parser, RichJsonContext& context);

} // namespace RichJson

#endif
