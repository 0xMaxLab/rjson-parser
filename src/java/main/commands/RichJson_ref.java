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
        // Falls der Pfad leer ist, gib root zurück (JS: if (context.currentMember === ""))
        if (context.currentMember == null || context.currentMember.toString().isEmpty()) {
            return context.root;
        }

        // Starte die Auflösung beim Root-Element
        return resolvePathFrom(context.root, parser, context);
    }

    /**
     * Kern-Logik aus dem JS-Code: Iteriert über Pfad-Segmente und parst diese sukzessive.
     */
    @SuppressWarnings("unchecked")
    protected Object resolvePathFrom(Object startNode, RichJsonParser parser, RichJsonContext context) throws Exception {
        Object prevMember = startNode;
        String originalAddress = context.currentAddress;

        // Splitte den Pfad anhand des Delimiters (z.B. ".")
        String[] refs = context.currentMember.toString().split(RichJsonConstants.COMMAND_PATH_DELIMITER);

        for (String ref : refs) {
            // Prüfe, ob das aktuelle Objekt eine Map (JsonObject) ist
            if (prevMember instanceof Map) {
                Map<String, Object> map = (Map<String, Object>) prevMember;
                if (map.containsKey(ref)) {
                    context.currentMember = map.get(ref);
                } else {
                    throw new RuntimeException("Member '" + ref + "' in '" +
                            parser.cache.resolveAddress(prevMember) + "' does not exist");
                }
            } else {
                // Falls wir versuchen in etwas zu greifen, das keine Map ist
                throw new RuntimeException("Cannot resolve member '" + ref + "' because parent is not an object.");
            }

            // Adresse für den Cache/Kontext aktualisieren (JS Logik)
            context.currentAddress = (context.currentMember instanceof Map || context.currentMember instanceof List)
                    ? parser.cache.resolveAddress(context.currentMember)
                    : RichJsonHelper.concatStrings(parser.cache.resolveAddress(prevMember), "_", ref);

            // WICHTIG: Das gefundene Member parsen, bevor es zum prevMember für die nächste Iteration wird
            context.currentMember = parser.__parseRichJsonInMember();
            prevMember = context.currentMember;
        }

        // Adresse zurücksetzen und Ergebnis liefern
        context.currentAddress = originalAddress;
        return context.currentMember;
    }
}