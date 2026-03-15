/*
	reads the data tree of the given folder path
*/

import {readRichJsonDirectory} from "../RichJsonFileHelper";

export function __executeFolderCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return readRichJsonDirectory(currentMember);
}