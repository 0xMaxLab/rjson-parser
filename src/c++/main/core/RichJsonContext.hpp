#ifndef RICH_JSON_CONTEXT_HPP
#define RICH_JSON_CONTEXT_HPP

#include <nlohmann/json.hpp>
#include <string>
#include <vector>

namespace RichJson {

using json = nlohmann::json;

// Ported from core/RichJsonContext.java. `root`/`current` point into the live
// tree being parsed (repointable, e.g. $env temporarily swaps `root` to an
// environment value and restores it afterwards) so that lazily-triggered
// resolution mutates the actual node rather than a disconnected copy.
// `currentMember` is a plain value: like Java's local var of the same name,
// it's reassigned throughout resolution and written back into its parent
// container slot once resolved.
struct RichJsonContext {
    json* root = nullptr;
    json* current = nullptr;
    json currentMember;
    std::string currentCommand;
    std::string currentAddress;
    std::string currentName;
    std::vector<std::string> currentPath;

    // Address anchors for $ref (rootAddress) and $this (containerAddress).
    // Java derives these on demand from object identity (System.identityHashCode),
    // which is safe there because Map/List are reference types. RichJsonParser
    // instead works on defensive value copies at each recursion level (see
    // parseRichJsonInMember) to avoid self-aliasing corruption, so a raw
    // pointer/address computed from a transient copy can be silently reused by
    // an unrelated later copy once the original goes out of scope. These two
    // fields instead track a purely compositional (path-based) address string
    // that stays valid regardless of where the underlying value physically
    // lives - see RichJson_ref.cpp/RichJson_this.cpp.
    //
    // Known limitation: this only matters for genuinely circular/self-
    // referential input (e.g. "$this:" at the root, or an inheritance/$ref
    // chain that loops back on itself). Java/JS resolve these to a live,
    // mutable Map/List reference, so e.g. `content.get("this") == content`
    // holds forever and indexing arbitrarily deep stays consistent, because
    // it's literally the same object. There is no finite nlohmann::json
    // value V with V == {"this": V}, so this port instead resolves such
    // cycles to a bounded, deterministic snapshot (see the RichJson.This/
    // RichJson.Ref/RichJson.Inheritance tests) rather than an infinitely-
    // unfolding alias. Everything else (the vast majority of real RichJSON
    // documents, which don't self-reference) is unaffected.
    std::string rootAddress;
    std::string containerAddress;
};

} // namespace RichJson

#endif
