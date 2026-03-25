/*
    references the given member on self
*/

import {__executeRefCommand} from "./RichJson_ref.js";

export function __executeThisCommand(parser, context) {
    return __executeRefCommand(parser, context);
}