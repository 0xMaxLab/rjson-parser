/*
	merges the given folder in one object
*/

import {__executeFolderCommand} from "./RichJson_folder.js";
import {getKeysSorted, mergeIntoTarget} from "../RichJsonHelper.js";

export function __executeMergeFolderCommand(parser, context) {
    let folder = __executeFolderCommand(parser, context);
    let entry_names = getKeysSorted(folder);
    let rv = {};

    if (entry_names.length !== 0) {
        for (let i = 0; i < entry_names.length; ++i) {
            mergeIntoTarget(rv, folder[entry_names[i]]);
        }
    }

    return rv;
}