package commands;

import core.RichJsonCommand;
import core.RichJsonContext;
import core.RichJsonParser;

import java.util.function.Supplier;

public class RichJson_invoke implements RichJsonCommand {
    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        if (context.currentMember instanceof Supplier) {
            return ((Supplier<?>) context.currentMember).get();
        }
        throw new Exception(String.format("RichJson the given function in '%s' is not a supplier", context.currentName));
    }
}