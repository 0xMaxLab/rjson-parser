package commands;

import core.*;
import other.RichJsonEnvironment;

import java.util.Map;

public class RichJson_env implements RichJsonCommand {
    @Override
    @SuppressWarnings("unchecked")
    public Object execute(RichJsonParser parser, RichJsonContext context) throws Exception {
        if (context.currentMember instanceof Map) {
            RichJsonEnvironment.addEnvironmentVariables((Map<String, Object>) context.currentMember);
            return context.currentMember;
        }

        String memberStr = (String) context.currentMember;
        String[] ref = memberStr.split(RichJsonConstants.COMMAND_PATH_DELIMITER, 2);
        String firstRef = ref[0];

        if (RichJsonEnvironment.env.containsKey(firstRef)) {
            Object envVal = RichJsonEnvironment.env.get(firstRef);
            context.currentMember = envVal;

            // Setzt temporär den Root auf die Env-Variable für interne Auflösungen
            context.root = (envVal instanceof Map) ? envVal : Map.of();
            context.currentAddress = parser.cache.resolveAddress(context.root);

            // Rekursives Parsen des Inhalts der Env-Variable
            context.currentMember = parser.__parseRichJsonInMember();
            RichJsonEnvironment.env.put(firstRef, context.currentMember);

            if (ref.length == 2) {
                context.currentMember = ref[1];
                return RichJsonCommandHolder.executeCommand("ref", parser, context);
            }
            return context.currentMember;
        } else {
            throw new RuntimeException("Environment variable '" + memberStr + "' does not exist.");
        }
    }
}