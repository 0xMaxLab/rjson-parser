/*
	reads the data tree of the given folder path
*/

import {readDirectory} from "../helper/RichJsonFileHelper.js";

export function __executeFolderCommand(parser, context) {
    return readDirectory(context.currentMember, true);
}