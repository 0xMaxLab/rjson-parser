package commands;

import core.RichJsonCommand;
import core.RichJsonConstants;
import core.RichJsonContext;
import helper.RichJsonHelper;
import core.RichJsonParser;

import java.util.Map;
import java.util.List;

public class RichJson_ref implements RichJsonCommand {

    @Override
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        if (context.currentMember == null || context.currentMember.toString().isEmpty()) {
            return context.root;
        }

        return resolvePathFrom(context.root, parser, context);
    }

    /**
     * Kern-Logik aus dem JS-Code: Iteriert über Pfad-Segmente und parst diese sukzessive.
     */
    @SuppressWarnings("unchecked")
    protected Object resolvePathFrom(Object startNode, RichJsonParser parser, RichJsonContext context) throws Exception {
        Object prevMember = startNode;
        String originalAddress = context.currentAddress;

        String[] refs = context.currentMember.toString().split(RichJsonConstants.COMMAND_PATH_DELIMITER);

        for (String ref : refs) {
            if (prevMember instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) prevMember;
                if (map.containsKey(ref)) {
                    context.currentMember = map.get(ref);
                } else {
                    throw new RuntimeException("Member '" + ref + "' in '" +
                            parser.cache.resolveAddress(prevMember) + "' does not exist");
                }
            } else {
                throw new RuntimeException("Cannot resolve member '" + ref + "' because parent is not an object.");
            }

            context.currentAddress = (context.currentMember instanceof Map || context.currentMember instanceof List)
                    ? parser.cache.resolveAddress(context.currentMember)
                    : parser.cache.resolveAddress(prevMember) + "_" + ref;

            context.currentMember = parser.__parseRichJsonInMember();
            context.currentPath.add(ref);
            prevMember = context.currentMember;
        }

        context.currentAddress = originalAddress;
        context.currentPath.subList(context.currentPath.size() - refs.length, context.currentPath.size()).clear();
        return context.currentMember;
    }
}