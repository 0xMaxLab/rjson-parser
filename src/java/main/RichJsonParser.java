import java.util.*;
import java.util.regex.Pattern;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class RichJsonParser {
    public RichJsonCache cache = new RichJsonCache();
    public RichJsonContext con = new RichJsonContext();
    private ObjectMapper mapper = new ObjectMapper();

    static class IpnResult {
        String result;
        boolean isParsed;
        IpnResult(String r, boolean p) { this.result = r; this.isParsed = p; }
    }

    public Object parse(Object current) throws Exception {
        return parse(current, false);
    }

    @SuppressWarnings("unchecked")
    public Object parse(Object current, boolean isRoot) throws Exception {
        this.con.current = current;
        this.cache.level++;

        if (isRoot) {
            this.con.root = current;
            this.con.currentMember = current;
            this.con.currentAddress = this.cache.resolveAddress(current);
            this.con.current = this.__parseRichJsonInMember();
            this.cache.level--;
            if (this.cache.level == 0 && RichJsonConfig.debugEnabled) {
                System.out.println("RichJson was applied successfully.");
            }
            return this.con.current;
        }

        String currentName = this.con.currentName;
        String currentAddress = this.con.currentAddress;

        if (current instanceof Map) {
            this.__preprocess_kcommands_constructors_inheritances();
            Map<String, Object> map = (Map<String, Object>) current;
            List<String> names = new ArrayList<>(map.keySet());
            Collections.sort(names);

            for (String name : names) {
                this.con.currentMember = map.get(name);
                boolean isComplex = this.con.currentMember instanceof Map || this.con.currentMember instanceof List;

                this.con.currentAddress = isComplex ? this.cache.resolveAddress(this.con.currentMember) : RichJsonHelper.concatStrings(currentAddress, "_" + name);
                this.con.currentName = name;
                this.con.currentMember = this.__parseRichJsonInMember();
                map.put(name, this.con.currentMember);
            }
        } else if (current instanceof List) {
            List<Object> list = (List<Object>) current;
            for (int i = 0; i < list.size(); i++) {
                this.con.currentMember = list.get(i);
                boolean isComplex = this.con.currentMember instanceof Map || this.con.currentMember instanceof List;

                this.con.currentAddress = isComplex ? this.cache.resolveAddress(this.con.currentMember) : RichJsonHelper.concatStrings(currentAddress, "_" + i);
                this.con.currentName = currentName + "_" + i;
                this.con.currentMember = this.__parseRichJsonInMember();
                list.set(i, this.con.currentMember);
            }
        }

        this.cache.level--;
        return current;
    }

    @SuppressWarnings("unchecked")
    private void __preprocess_kcommands_constructors_inheritances() throws Exception {
        Map<String, Object> map = (Map<String, Object>) this.con.current;
        List<String> names = new ArrayList<>(map.keySet());

        for (String name : names) {
            boolean iscmd = RichJsonConstants.isCommand(name);
            boolean isctr = RichJsonConstants.isConstructor(name);
            boolean isite = RichJsonConstants.isInheritance(name);

            if (iscmd || isctr || isite) {
                Object member = map.remove(name);
                String ite = null;

                if (iscmd) {
                    String[] parts = name.split(RichJsonConstants.COMMAND_SUFFIX, 2);
                    String[] kcmd = parts[0].substring(1).split(Pattern.quote(RichJsonConstants.COMMAND_PREFIX));
                    if (member instanceof Map) {
                        ((Map<String, Object>) member).put(RichJsonConstants.KEY_COMMAND_MEMBER, new ArrayList<>(Arrays.asList(kcmd)));
                    }
                    name = parts[1];
                }

                if (isite) {
                    String[] parts = name.split(RichJsonConstants.INHERITANCE_SIGN, 2);
                    ite = parts[1].trim();
                    name = parts[0];
                }

                if (isctr) {
                    if (RichJsonConstants.isLateConstructor(name)) {
                        // LATE CONSTRUCTOR: Nur die Klasse für später merken
                        String[] parts = name.split(RichJsonConstants.LATE_CONSTRUCTOR_SIGN, 2);
                        if (member instanceof Map) {
                            ((Map<String, Object>) member).put(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER, RichJsonClassMapping.__mapClassByName(parts[1].trim()));
                        }
                        name = parts[0];
                    } else {
                        // EARLY CONSTRUCTOR: Mit Jackson bauen (Defaults laden), zurück in Map, Klasse merken
                        String[] parts = name.split(RichJsonConstants.CONSTRUCTOR_SIGN, 2);
                        Class<?> ctr = RichJsonClassMapping.__mapClassByName(parts[1].trim());

                        Object instance = mapper.convertValue(member, ctr);
                        member = mapper.convertValue(instance, new TypeReference<Map<String, Object>>() {});
                        ((Map<String, Object>) member).put(RichJsonConstants.EARLY_CONSTRUCTOR_MEMBER, ctr);

                        name = parts[0];
                    }
                }

                if (isite) {
                    this.cache.inheritances.put(this.cache.resolveAddress(member), ite);
                }

                map.put(name.trim(), member);
                if (!(member instanceof Map) && isite) {
                    throw new RuntimeException("Inheritance on member '" + name + "' is not possible, because it is not an object.");
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private Object __parseRichJsonInMember() throws Exception {
        if (this.cache.stack.containsKey(this.con.currentAddress)) {
            return this.cache.stack.get(this.con.currentAddress);
        } else {
            this.cache.stack.put(this.con.currentAddress, this.con.currentMember);
        }

        if (!(this.con.currentMember instanceof String || this.con.currentMember instanceof List || this.con.currentMember instanceof Map)) {
            return this.con.currentMember;
        }

        if (this.con.currentMember instanceof String) {
            String strMember = (String) this.con.currentMember;
            if (RichJsonHelper.matchesWildcard(strMember, RichJsonConstants.INTERPOLATION_WILDCARD)) {
                this.con.currentMember = this.__parseInterpolations().result;
            }
            return this.__executeRichJsonCommandIfContainedInMember();
        } else {
            List<String> kcmd_ignored = new ArrayList<>();
            String currentAddress = this.con.currentAddress;
            boolean isMap = this.con.currentMember instanceof Map;

            if (isMap) {
                this.__executeClone();
                this.cache.stack.put(currentAddress, this.con.currentMember);
                kcmd_ignored = this.__getIgnoresForKeyCommands();
                for (String ignored : kcmd_ignored) { RichJsonCommandHolder.setCommandEnabled(ignored, false); }
                this.__resolveInheritances();
            }

            // Rekursiver Aufruf für die Kind-Elemente
            this.con.currentMember = this.parse(this.con.currentMember, false);

            if (isMap && this.con.currentMember instanceof Map) {
                this.__resetCloneIfPossible(currentAddress);
                for (String ignored : kcmd_ignored) { RichJsonCommandHolder.setCommandEnabled(ignored, true); }
                this.con.currentMember = this.__executeKeyCommands();

                // === FINALE POJO KONVERTIERUNG ===
                Map<String, Object> map = (Map<String, Object>) this.con.currentMember;

                // Early Constructor finalisieren
                if (map.containsKey(RichJsonConstants.EARLY_CONSTRUCTOR_MEMBER)) {
                    Class<?> cstr = (Class<?>) map.remove(RichJsonConstants.EARLY_CONSTRUCTOR_MEMBER);
                    this.con.currentMember = mapper.convertValue(map, cstr);
                    if (RichJsonConfig.debugEnabled) System.out.println("RichJson finished early construct for '" + cstr.getName() + "'.");
                }
                // Late Constructor finalisieren
                else if (RichJsonConfig.lateConstructorEnabled && map.containsKey(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER)) {
                    Class<?> cstr = (Class<?>) map.remove(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER);
                    this.con.currentMember = mapper.convertValue(map, cstr);
                    if (RichJsonConfig.debugEnabled) System.out.println("RichJson resolved late construct for '" + cstr.getName() + "'.");
                }
            }
            return this.con.currentMember;
        }
    }

    private IpnResult __parseInterpolations() {
        // Implementierung analog zum JavaScript-Original (String-Manipulation)
        return new IpnResult((String) this.con.currentMember, true);
    }

    private Object __executeRichJsonCommandIfContainedInMember() throws Exception {
        if (this.con.currentMember instanceof String && RichJsonHelper.matchesWildcard((String) this.con.currentMember, RichJsonConstants.COMMAND_WILDCARD)) {
            this.cache.stack.put(this.con.currentAddress, new HashMap<String, Object>());

            String[] parts = ((String) this.con.currentMember).split(RichJsonConstants.COMMAND_SUFFIX, 2);
            this.con.currentCommand = parts[0];
            this.con.currentMember = parts[1].trim();

            this.con.currentMember = this.__tryRichJsonCommand();

            this.__resetCloneIfPossible(this.con.currentAddress);

            // HIER WAR DER FEHLER: In Java dürfen wir hier nicht in die leere Map mergen,
            // sondern müssen die fertige Referenz einfach im Stack speichern!
            this.cache.stack.put(this.con.currentAddress, this.con.currentMember);
        }
        return this.con.currentMember;
    }

    @SuppressWarnings("unchecked")
    private List<String> __getIgnoresForKeyCommands() {
        List<String> rv = new ArrayList<>();
        if (this.con.currentMember instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) this.con.currentMember;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER)) {
                List<String> kcmds = (List<String>) map.get(RichJsonConstants.KEY_COMMAND_MEMBER);
                for (String kcmd : kcmds) {
                    if (RichJsonCommandHolder.isCommandEnabled(kcmd)) {
                        rv.addAll(RichJsonCommandHolder.getIgnoredKeyCommands(kcmd));
                    }
                }
            }
        }
        return rv;
    }

    private Object __tryRichJsonCommand() throws Exception {
        String unresolved_command = this.con.currentCommand;
        this.con.currentCommand = this.con.currentCommand.substring(1); // Das '$' entfernen

        if (this.con.currentMember instanceof String) {
            this.con.currentMember = ((String) this.con.currentMember).replace(RichJsonConstants.ARRAY_REPLACE_SUBSTRING, RichJsonConstants.ARRAY_REPLACE_NEWSTRING);
        }

        String unresolved_member = String.valueOf(this.con.currentMember);

        // Pipe-Commands (|) auflösen
        List<String> pipe_commands = null;
        if (this.con.currentMember instanceof String && ((String) this.con.currentMember).contains(RichJsonConstants.COMMAND_PIPE_SIGN)) {
            pipe_commands = new ArrayList<>(Arrays.asList(((String) this.con.currentMember).split(Pattern.quote(RichJsonConstants.COMMAND_PIPE_SIGN))));
            this.con.currentMember = pipe_commands.remove(0);
        }

        // Batch-Commands ($ref$clone) auflösen
        String[] batch_commands = this.con.currentCommand.split(Pattern.quote(RichJsonConstants.COMMAND_PREFIX));
        for (String batchCmd : batch_commands) {
            this.con.currentCommand = batchCmd;
            if (RichJsonCommandHolder.isCommandEnabled(this.con.currentCommand)) {
                if (this.con.currentMember instanceof String && RichJsonHelper.matchesWildcard((String) this.con.currentMember, RichJsonConstants.ARRAY_WILDCARD)) {
                    String[] array = ((String) this.con.currentMember).split("[\\[\\]]");
                    this.con.currentMember = array[0];
                    this.con.currentMember = RichJsonCommandHolder.executeCommand(this.con.currentCommand, this, this.con);
                    if (this.con.currentMember instanceof List && array.length > 1) {
                        this.con.currentMember = ((List<?>) this.con.currentMember).get(Integer.parseInt(array[1].trim()));
                    } else if (this.con.currentMember instanceof Map && array.length > 1) {
                        this.con.currentMember = ((Map<?, ?>) this.con.currentMember).get(array[1].trim());
                    }
                } else {
                    this.con.currentMember = RichJsonCommandHolder.executeCommand(this.con.currentCommand, this, this.con);
                }
            } else {
                return unresolved_command + unresolved_member;
            }
        }

        if (pipe_commands == null || pipe_commands.isEmpty()) {
            return this.con.currentMember;
        }

        // Pipes rekursiv abarbeiten
        Object rootBackup = this.con.root;
        for (String pipeCmd : pipe_commands) {
            String[] parts = pipeCmd.split(RichJsonConstants.COMMAND_SUFFIX, 2);
            if (parts.length == 1) {
                this.con.currentCommand = RichJsonConstants.COMMAND_REF;
                this.con.currentMember = parts[0].trim();
            } else {
                this.con.currentCommand = parts[0].trim();
                this.con.currentMember = parts[1].trim();
            }
            // Root ändert sich für den Pipe-Befehl
            this.con.root = this.con.currentMember;
            this.con.currentMember = this.__tryRichJsonCommand();
        }
        this.con.root = rootBackup;

        return this.con.currentMember;
    }

    @SuppressWarnings("unchecked")
    private void __executeClone() throws Exception {
        if (this.con.currentMember instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) this.con.currentMember;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER)) {
                List<String> keyCommands = (List<String>) map.get(RichJsonConstants.KEY_COMMAND_MEMBER);
                if (keyCommands.contains(RichJsonConstants.COMMAND_CLONE) && RichJsonCommandHolder.isCommandEnabled(RichJsonConstants.COMMAND_CLONE)) {
                    this.con.currentCommand = RichJsonConstants.COMMAND_CLONE;
                    this.con.currentMember = this.__tryRichJsonKeyCommand();

                    if (this.con.currentMember instanceof Map) {
                        keyCommands = (List<String>) ((Map<String, Object>) this.con.currentMember).get(RichJsonConstants.KEY_COMMAND_MEMBER);
                        keyCommands.remove(RichJsonConstants.COMMAND_CLONE);
                    }
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void __resolveInheritances() throws Exception {
        String chainStr = this.cache.inheritances.get(this.con.currentAddress);
        if (chainStr == null) return;

        String[] inheritance_chain = chainStr.split(RichJsonConstants.COMMAND_DELIMITER);

        if (!(this.con.currentMember instanceof Map)) { return; }
        Map<String, Object> member = (Map<String, Object>) this.con.currentMember;

        for (String item : inheritance_chain) {
            this.con.currentMember = item.trim();
            if (RichJsonHelper.matchesWildcard((String) this.con.currentMember, RichJsonConstants.COMMAND_WILDCARD)) {
                String[] parts = ((String) this.con.currentMember).split(RichJsonConstants.COMMAND_SUFFIX, 2);
                this.con.currentCommand = parts[0].trim().substring(1); // NEU: $ entfernen
                this.con.currentMember = parts[1].trim();
            } else {
                this.con.currentCommand = "ref"; // NEU: Ohne $
            }

            Object resolvedCommand = this.__tryRichJsonCommand();
            Object clonedCommand = RichJsonHelper.cloneObject(resolvedCommand);

            // NEU: Typsicher mergen!
            if (clonedCommand instanceof Map) {
                member = RichJsonHelper.mergeIntoTarget(member, (Map<String, Object>) clonedCommand);
            }
        }
        this.con.currentMember = member;
    }

    private void __resetCloneIfPossible(String _address) {
        if (this.cache.cloneAddress != null && _address.equals(this.cache.cloneAddress)) {
            this.cache.cloneAddress = null;
        }
    }

    @SuppressWarnings("unchecked")
    private Object __executeKeyCommands() throws Exception {
        if (this.con.currentMember instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) this.con.currentMember;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER)) {
                List<String> keyCommands = (List<String>) map.get(RichJsonConstants.KEY_COMMAND_MEMBER);

                Iterator<String> it = keyCommands.iterator();
                while (it.hasNext()) {
                    String command = it.next();
                    if (RichJsonCommandHolder.isCommandEnabled(command)) {
                        this.con.currentCommand = command;
                        this.con.currentMember = this.__tryRichJsonKeyCommand();
                        it.remove();
                    }
                }

                if (keyCommands.isEmpty()) {
                    map.remove(RichJsonConstants.KEY_COMMAND_MEMBER);
                }
            }
        }
        return this.con.currentMember;
    }

    private Object __tryRichJsonKeyCommand() throws Exception {
        return RichJsonCommandHolder.executeCommand(this.con.currentCommand, this, this.con);
    }
}