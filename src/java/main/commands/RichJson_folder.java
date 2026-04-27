package commands;

import core.RichJsonCommand;
import core.RichJsonConstants;
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
        return RichJsonFileHelper.readDirectory(folderPath, true);
    }
}