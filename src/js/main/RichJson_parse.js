import {__parseRichJson} from "./RichJson.js";
import {__RICH_JSON_CONFIG} from "./RichJsonConfiguration.js";

/**
 * Parses RichJson expressions in JSON object.
 * @param _struct
 * @returns {*|string}
 */
export function parse(_struct) {
    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug(`RichJson is going to be applied due to.`);
    }

    let rv = __parseRichJson(_struct, _struct, undefined, undefined);

    if (__RICH_JSON_CONFIG.debugEnabled) {
        console.debug("RichJson was applied successfully.");
    }

    return rv;
}