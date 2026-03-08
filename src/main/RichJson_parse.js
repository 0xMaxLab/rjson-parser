

import {__parseRichJson} from "./RichJson";
import {DEBUG_LOG_RICH_JSON} from "./RichJsonConfiguration";

/**
 * Parses RichJson expressions in JSON object.
 * @param _struct
 * @returns {*|string}
 */
export function parseRichJson(_struct) {
    if (DEBUG_LOG_RICH_JSON)
        console.debug(`RichJson is going to be applied due to.`);

    let rv = __parseRichJson(_struct, _struct, undefined, undefined);

    if (DEBUG_LOG_RICH_JSON)
        console.debug("RichJson was applied successfully.");

    return rv;
}