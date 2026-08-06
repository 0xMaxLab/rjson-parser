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

class RichJsonParser {
private:
    static inline int NEXT_ID = 0;
    int id_;
    std::string label_;

public:
    RichJsonParser();

    json parse(json& current, bool isRoot);

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
        std::string result;e
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

}

#endif
