package commands;

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
        // Der Pfad wird aus dem aktuellen Member-Wert extrahiert
        String folderPath = (String) context.currentMember;

        if (folderPath == null || folderPath.isEmpty()) {
            throw new RuntimeException("Folder path for 'folder' command is empty in " + context.currentAddress);
        }

        // Ruft den FileHelper auf, um das Verzeichnis zu lesen
        // Das zweite Argument 'true' steht meist für rekursives Einlesen
        Object directoryContent = RichJsonFileHelper.readDirectory(folderPath, true);

        if (RichJsonConfig.debugEnabled) {
            System.out.println("RichJson read directory: " + folderPath);
        }

        return directoryContent;
    }
}