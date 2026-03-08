/*
	reads the data tree of the given folder path
*/

import {string_contains, string_split, string_trim} from "../RichJsonHelper";
import {__executeRefCommand} from "./RichJson_cmd_ref";
import {__RICH_JSON_COMMAND_PATH_DELIMITER} from "../RichJson";
import {directory_read_struct, readRichJsonDirectory} from "../RichJsonFileHelper";

export function __executeFolderCommand(root, current, currentCommand, currentMember, currentAddress, currentName) {
    return readRichJsonDirectory(currentMember);
}