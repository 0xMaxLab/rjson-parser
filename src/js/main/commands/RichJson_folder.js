/*
	reads the data tree of the given folder path
*/

import {readRichJsonDirectory} from "../RichJsonFileHelper.js";

export function __executeFolderCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return readRichJsonDirectory(currentMember);
}