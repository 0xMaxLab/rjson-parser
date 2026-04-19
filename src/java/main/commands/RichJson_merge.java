package commands;

import core.*;
import helper.RichJsonHelper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class RichJson_merge implements RichJsonCommand {
    @Override
    @SuppressWarnings("unchecked")
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        String[] refs = ((String) context.currentMember).split(RichJsonConstants.COMMAND_DELIMITER);
        Object structOrArray = parser.cache.stack.get(context.currentAddress);
        String originalAddress = context.currentAddress;

        context.currentMember = refs[0].trim();
        context.currentMember = RichJsonCommandHolder.executeCommand("ref", parser, context);
        context.currentAddress = originalAddress;

        if (context.currentMember instanceof Map) {
            Map<String, Object> targetMap = (Map<String, Object>) structOrArray;
            RichJsonHelper.mergeIntoTarget(targetMap, (Map<String, Object>) context.currentMember);

            for (int i = 1; i < refs.length; i++) {
                context.currentMember = refs[i].trim();
                Object nextRef = RichJsonCommandHolder.executeCommand("ref", parser, context);
                context.currentAddress = originalAddress;
                RichJsonHelper.mergeIntoTarget(targetMap, (Map<String, Object>) nextRef);
            }
            return targetMap;
        } else {
            List<Object> targetList = new ArrayList<>();
            parser.cache.stack.put(originalAddress, targetList);

            for (int i = 0; i < refs.length; i++) {
                context.currentMember = refs[i].trim();
                List<Object> nextRef = (List<Object>) RichJsonCommandHolder.executeCommand("ref", parser, context);
                context.currentAddress = originalAddress;
                targetList.addAll(nextRef);
            }
            return targetList;
        }
    }
}