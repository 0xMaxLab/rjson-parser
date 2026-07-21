#ifndef RICH_JSON_CONFIG_HPP
#define RICH_JSON_CONFIG_HPP

#include <optional>

namespace RichJson {

// Ported from other/RichJsonConfig.java (global toggles for the library).
struct RichJsonConfig {
    bool infoEnabled = true;
    bool debugEnabled = false;
    bool lateConstructorEnabled = true;
    bool stringInterpolationsEnabled = true;
    bool crashOnNestedCloneEnabled = true;
    bool fileCacheEnabled = true;
};

inline RichJsonConfig __RICH_JSON_CONFIG;

struct RichJsonConfigUpdate {
    std::optional<bool> infoEnabled;
    std::optional<bool> debugEnabled;
    std::optional<bool> lateConstructorEnabled;
    std::optional<bool> stringInterpolationsEnabled;
    std::optional<bool> crashOnNestedCloneEnabled;
    std::optional<bool> fileCacheEnabled;
};

inline void updateConfiguration(const RichJsonConfigUpdate& update) {
    if (update.infoEnabled) __RICH_JSON_CONFIG.infoEnabled = *update.infoEnabled;
    if (update.debugEnabled) __RICH_JSON_CONFIG.debugEnabled = *update.debugEnabled;
    if (update.lateConstructorEnabled) __RICH_JSON_CONFIG.lateConstructorEnabled = *update.lateConstructorEnabled;
    if (update.stringInterpolationsEnabled) __RICH_JSON_CONFIG.stringInterpolationsEnabled = *update.stringInterpolationsEnabled;
    if (update.crashOnNestedCloneEnabled) __RICH_JSON_CONFIG.crashOnNestedCloneEnabled = *update.crashOnNestedCloneEnabled;
    if (update.fileCacheEnabled) __RICH_JSON_CONFIG.fileCacheEnabled = *update.fileCacheEnabled;
}

} // namespace RichJson

#endif
