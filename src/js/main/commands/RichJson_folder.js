/*
	reads the data tree of the given folder path
*/

import {readDirectory} from "../RichJsonFileHelper.js";

export function __executeFolderCommand(parser, context) {
    return readDirectory(context.currentMember);
}