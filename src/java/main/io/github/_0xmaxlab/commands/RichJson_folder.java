package io.github._0xmaxlab.commands;

import io.github._0xmaxlab.core.RichJsonCommand;
import io.github._0xmaxlab.core.RichJsonContext;
import io.github._0xmaxlab.helper.RichJsonFileHelper;
import io.github._0xmaxlab.core.RichJsonParser;

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