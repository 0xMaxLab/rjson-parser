package io.github._0xmaxlab.commands;

import io.github._0xmaxlab.core.RichJsonCommand;
import io.github._0xmaxlab.core.RichJsonCommandHolder;
import io.github._0xmaxlab.core.RichJsonContext;
import io.github._0xmaxlab.helper.RichJsonHelper;
import io.github._0xmaxlab.core.RichJsonParser;

public class RichJson_copy implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        Object referencedValue = RichJsonCommandHolder.executeCommand("ref", parser, context);
        return RichJsonHelper.cloneObject(referencedValue);
    }
}