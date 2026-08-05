package io.github._0xmaxlab.commands;

import io.github._0xmaxlab.core.RichJsonCommand;
import io.github._0xmaxlab.core.RichJsonContext;
import io.github._0xmaxlab.helper.RichJsonFileHelper;
import io.github._0xmaxlab.core.RichJsonParser;

public class RichJson_file implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) {
        String fileName = context.currentMember + ".json";
        return RichJsonFileHelper.readFile(fileName, true);
    }
}