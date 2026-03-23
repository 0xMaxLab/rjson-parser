import {__parseRichJson, RichJsonParser} from "./RichJson.js";
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

    return new RichJsonParser().parse(_struct, _struct, undefined, undefined);
}