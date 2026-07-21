#ifndef RICH_JSON_PARSER_HPP
#define RICH_JSON_PARSER_HPP

#include "RichJsonCache.hpp"
#include "RichJsonContext.hpp"
#include "../helper/RichJsonLogger.hpp"
#include <nlohmann/json.hpp>
#include <sstream>
#include <string>
#include <vector>

namespace RichJson {

using json = nlohmann::json;

// Ported from core/RichJsonParser.java. Operates on the live json tree via
// references (matching Java's Map/List reference semantics for the duration
// of a single parse() call) so that lazily-triggered resolution (via $ref,
// $this, inheritance, ...) mutates the actual node being built rather than a
// disconnected copy.
class RichJsonParser {
private:
    // Declared first so they're initialized before `logger` below (members
    // initialize in declaration order regardless of access-specifier
    // grouping, and RichJsonLogger's constructor requires `label_` already set).
    static inline int NEXT_ID = 0;
    int id_;
    std::string label_;

public:
    RichJsonParser();

    // Entry point. isRoot=true starts a fresh top-level parse; the recursive
    // descent calls itself with isRoot=false for each container node.
    json parse(json& current, bool isRoot);

    // Resolves whatever `con.currentMember` currently holds (string command,
    // nested object/array, or plain scalar). Public because commands
    // (RichJson_ref, RichJson_this, RichJson_env) trigger it directly to
    // force lazy resolution of a referenced node.
    json parseRichJsonInMember();

    RichJsonCache cache;
    RichJsonContext con;
    RichJsonLogger logger;
    const std::string& label() const { return label_; }

private:
    struct InterpolationData {
        std::string rv;
        bool isParsed = true;
    };
    struct InterpolationResult {
        std::string result;
        bool isParsed;
    };

    void preprocessKcommandsConstructorsInheritances();
    InterpolationResult parseInterpolations();
    std::vector<std::string> getIgnoresForKeyCommands();
    json executeRichJsonCommandIfContainedInMember();
    json tryRichJsonCommand();
    bool isRichJsonCommandEnabled(const std::string& command);
    void executeClone();
    void callConstructor();
    void resolveInheritances();
    void resetCloneIfPossible(const std::string& address);
    bool isCloneApplying();
    json executeKeyCommands();
    json tryRichJsonKeyCommand();

    static std::string joinPath(const std::vector<std::string>& path, const std::string& delimiter);
};

} // namespace RichJson

#endif
