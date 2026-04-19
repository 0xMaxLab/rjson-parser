package commands;

import core.RichJsonCommand;
import other.RichJsonConfig;
import core.RichJsonContext;
import helper.RichJsonFileHelper;
import core.RichJsonParser;

/**
 * Liest den Datenbaum eines gegebenen Ordnerpfads ein.
 */
public class RichJson_folder implements RichJsonCommand {

    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) {
        String folderPath = (String) context.currentMember;

        if (folderPath == null || folderPath.isEmpty()) {
            throw new RuntimeException("Folder path for 'folder' command is empty in " + context.currentAddress);
        }

        Object directoryContent = RichJsonFileHelper.readDirectory(folderPath, true);

        if (RichJsonConfig.debugEnabled) {
            System.out.println("RichJson read directory: " + folderPath);
        }

        return directoryContent;
    }
}