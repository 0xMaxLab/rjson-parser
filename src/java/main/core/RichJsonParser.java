package core;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

public class RichJsonParser {
    public RichJsonCache cache = new RichJsonCache();
    private RichJsonContext con = new RichJsonContext();
    private ObjectMapper mapper = new ObjectMapper();

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

            if (this.cache.level == 0) {
                if (RichJsonConfig.debugEnabled) {
                    System.out.println("RichJson was applied successfully.");
                }
            }
            return current;
        }

        var isJsonObj = current instanceof Map;
        var currentName = this.con.currentName;
        var currentAddress = this.con.currentAddress;

        if (isJsonObj) {
            this.__preprocess_kcommands_constructors_inheritances();
            var map = (Map<String, Object>) current;
            var sortedKeys = RichJsonHelper.getKeysSorted(map);

            for (var name : sortedKeys) {
                var member = map.get(name);
                this.con.currentMember = member;
                this.con.currentAddress = (member instanceof Map || member instanceof List)
                        ? this.cache.resolveAddress(member)
                        : RichJsonHelper.concatStrings(currentAddress, "_" + name);

                this.con.currentName = name;
                this.con.currentMember = this.__parseRichJsonInMember();
                map.put(name, this.con.currentMember);
            }
        } else if (current instanceof List) {
            var list = (List<Object>) current;
            for (var i = 0; i < list.size(); i++) {
                var member = list.get(i);
                this.con.currentMember = member;
                this.con.currentAddress = (member instanceof Map || member instanceof List)
                        ? this.cache.resolveAddress(member)
                        : RichJsonHelper.concatStrings(currentAddress, "_" + i);

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
        var currentMap = (Map<String, Object>) this.con.current;
        var names = new ArrayList<>(currentMap.keySet());

        for (var name : names) {
            var iscmd = RichJsonConstants.isCommand(name);
            var isctr = RichJsonConstants.isConstructor(name);
            var isite = RichJsonConstants.isInheritance(name);

            if (iscmd || isctr || isite) {
                var member = currentMap.remove(name);
                var processedName = name;

                if (iscmd) {
                    var parts = processedName.split(RichJsonConstants.COMMAND_SUFFIX, 2);
                    var kcmdList = new ArrayList<>(Arrays.asList(parts[0].substring(1).split("\\" + RichJsonConstants.COMMAND_PREFIX)));
                    if (member instanceof Map) {
                        ((Map<String, Object>) member).put(RichJsonConstants.KEY_COMMAND_MEMBER, kcmdList);
                    }
                    processedName = parts[1];
                }

                String ite = null;
                if (isite) {
                    var parts = processedName.split(RichJsonConstants.INHERITANCE_SIGN, 2);
                    ite = parts[1].trim();
                    processedName = parts[0];
                }

                if (isctr) {
                    if (RichJsonConstants.isLateConstructor(processedName)) {
                        var parts = processedName.split(RichJsonConstants.LATE_CONSTRUCTOR_SIGN, 2);
                        var clazz = RichJsonClassMapping.__mapClassByName(parts[1].trim());
                        if (member instanceof Map) {
                            ((Map<String, Object>) member).put(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER, clazz);
                        }
                        processedName = parts[0];
                    } else {
                        var parts = processedName.split(RichJsonConstants.CONSTRUCTOR_SIGN, 2);
                        var ctrClass = RichJsonClassMapping.__mapClassByName(parts[1].trim());
                        try {
                            var instance = ctrClass.getDeclaredConstructor().newInstance();
                            var instanceMap = (Map<String, Object>) mapper.convertValue(instance, Map.class);
                            member = RichJsonHelper.__mergeIntoTarget(new RichJsonCache(), instanceMap, (Map<String, Object>) member, true);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        processedName = parts[0];
                    }
                }

                if (isite && member instanceof Map) {
                    this.cache.inheritances.put(this.cache.resolveAddress(member), ite);
                }

                currentMap.put(processedName.trim(), member);
                if (!(member instanceof Map)) {
                    throw new RuntimeException("Inheritance on member '" + processedName + "' is not possible because it is not an object.");
                }
            }
        }
    }

    public Object __parseRichJsonInMember() throws Exception {
        if (this.cache.stack.containsKey(this.con.currentAddress)) {
            return this.cache.stack.get(this.con.currentAddress);
        } else {
            this.cache.stack.put(this.con.currentAddress, this.con.currentMember);
        }

        if (!this.__isMemberRichJsonAble(this.con.currentMember)) {
            return this.con.currentMember;
        }

        if (this.con.currentMember instanceof String) {
            var strMember = (String) this.con.currentMember;
            if (RichJsonConfig.stringInterpolationsEnabled && RichJsonHelper.matchesWildcard(strMember, RichJsonConstants.INTERPOLATION_WILDCARD)) {
                var res = this.__parseInterpolations();
                if (!res.isParsed) {
                    return res.result;
                } else {
                    this.con.currentMember = res.result;
                }
            }
            return this.__executeRichJsonCommandIfContainedInMember();
        } else {
            var currentAddress = this.con.currentAddress;
            var isJsonObj = this.con.currentMember instanceof Map;
            var kcmd_ignored = new ArrayList<String>();

            if (isJsonObj) {
                this.__executeClone();
                this.__callConstructor();
                this.cache.stack.put(currentAddress, this.con.currentMember);
                kcmd_ignored = (ArrayList<String>) this.__getIgnoresForKeyCommands();
                for (var cmd : kcmd_ignored) RichJsonCommandHolder.setCommandEnabled(cmd, false);
                this.__resolveInheritances();
            }

            this.con.currentMember = this.parse(this.con.currentMember, false);

            if (isJsonObj) {
                this.__resetCloneIfPossible(currentAddress);
                for (var cmd : kcmd_ignored) RichJsonCommandHolder.setCommandEnabled(cmd, true);
                this.con.currentMember = this.__executeKeyCommands();
            }
            return this.con.currentMember;
        }
    }

    public boolean __isMemberRichJsonAble(Object member) {
        return member instanceof String || member instanceof List || member instanceof Map;
    }

    private InterpolationResult __parseInterpolations() {
        var rv = new StringBuilder();
        var inp = (String) this.con.currentMember;
        var ipnLevel = -1;
        var ipns = new ArrayList<InterpolationData>();

        for (var i = 0; i < inp.length(); ++i) {
            var c = inp.charAt(i);
            if (c == RichJsonConstants.INTERPOLATION_OPENING_SIGN) {
                if (i + 1 < inp.length()) {
                    var nextC = inp.charAt(i + 1);
                    if ((nextC == RichJsonConstants.INTERPOLATION_OPENING_SIGN || nextC == RichJsonConstants.INTERPOLATION_CLOSING_SIGN) &&
                            i + 2 < inp.length() && inp.charAt(i + 2) == RichJsonConstants.INTERPOLATION_CLOSING_SIGN) {
                        rv.append(nextC);
                        i += 2;
                        continue;
                    }
                }
                ipnLevel++;
            } else if (c == RichJsonConstants.INTERPOLATION_CLOSING_SIGN) {
                if (ipnLevel >= 0) {
                    var currentIpn = ipns.get(ipnLevel);
                    this.con.currentMember = currentIpn.rv.toString();
                    currentIpn.rv.setLength(0);
                    ipnLevel--;

                    if (ipns.size() == ipnLevel + 3 && !ipns.get(ipnLevel + 2).isParsed) {
                        this.con.currentMember = RichJsonHelper.concatStrings(String.valueOf(RichJsonConstants.INTERPOLATION_OPENING_SIGN), (String)this.con.currentMember, String.valueOf(RichJsonConstants.INTERPOLATION_CLOSING_SIGN));
                    } else {
                        this.con.currentMember = this.__executeRichJsonCommandIfContainedInMember();
                    }

                    var ipnParsed = !RichJsonHelper.matchesWildcard((String)this.con.currentMember, RichJsonConstants.COMMAND_WILDCARD);
                    if (!ipnParsed) ipns.get(ipnLevel + 1).isParsed = false;

                    this.con.currentMember = ipnParsed ? this.con.currentMember : RichJsonHelper.concatStrings(String.valueOf(RichJsonConstants.INTERPOLATION_OPENING_SIGN), (String)this.con.currentMember, String.valueOf(RichJsonConstants.INTERPOLATION_CLOSING_SIGN));

                    if (ipnLevel == -1) rv.append(this.con.currentMember);
                    else ipns.get(ipnLevel).rv.append(this.con.currentMember);
                } else {
                    rv.append(c);
                }
            } else if (ipnLevel > -1) {
                if (ipns.size() < ipnLevel + 1) ipns.add(new InterpolationData());
                ipns.get(ipnLevel).rv.append(c);
            } else {
                rv.append(c);
            }
        }
        var finalResult = rv.toString();
        this.cache.stack.put(this.con.currentAddress, finalResult);
        return new InterpolationResult(finalResult, ipns.isEmpty() || ipns.get(0).isParsed);
    }

    @SuppressWarnings("unchecked")
    private List<String> __getIgnoresForKeyCommands() {
        var rv = new ArrayList<String>();
        if (this.con.currentMember instanceof Map) {
            var map = (Map<String, Object>) this.con.currentMember;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER)) {
                var kcmds = (List<String>) map.get(RichJsonConstants.KEY_COMMAND_MEMBER);
                for (var kcmd : kcmds) {
                    if (this.__isRichJsonCommandEnabled(kcmd)) {
                        var ignoredForThisCmd = RichJsonCommandHolder.INSTANCE.kcmdIgnored.get(kcmd);
                        if (ignoredForThisCmd != null) {
                            rv.addAll(ignoredForThisCmd);
                        }
                    }
                }
            }
        }
        return rv;
    }

    private Object __executeRichJsonCommandIfContainedInMember() {
        var strMember = (String) this.con.currentMember;
        if (RichJsonHelper.matchesWildcard(strMember, RichJsonConstants.COMMAND_WILDCARD)) {
            this.cache.stack.put(this.con.currentAddress, new HashMap<String, Object>());
            var parts = strMember.split(RichJsonConstants.COMMAND_SUFFIX, 2);
            this.con.currentCommand = parts[0];
            this.con.currentMember = parts[1].trim();
            this.con.currentMember = this.__tryRichJsonCommand();
            this.__resetCloneIfPossible(this.con.currentAddress);
            this.cache.stack.put(this.con.currentAddress, this.con.currentMember);
        }
        return this.con.currentMember;
    }

    private Object __tryRichJsonCommand() {
        try {
            var unresolved_command = this.con.currentCommand;
            this.con.currentCommand = this.con.currentCommand.substring(1);
            var strMember = (String) this.con.currentMember;
            this.con.currentMember = strMember.replace(RichJsonConstants.ARRAY_REPLACE_SUBSTRING, RichJsonConstants.ARRAY_REPLACE_NEWSTRING);

            String[] pipe_commands = null;
            if (((String)this.con.currentMember).contains(RichJsonConstants.COMMAND_PIPE_SIGN)) {
                var split = ((String)this.con.currentMember).split("\\" + RichJsonConstants.COMMAND_PIPE_SIGN);
                this.con.currentMember = split[0];
                pipe_commands = Arrays.copyOfRange(split, 1, split.length);
            }

            var batch_commands = this.con.currentCommand.split("\\" + RichJsonConstants.COMMAND_PREFIX);
            for (var cmd : batch_commands) {
                this.con.currentCommand = cmd;
                if (this.__isRichJsonCommandEnabled(this.con.currentCommand)) {
                    if (RichJsonHelper.matchesWildcard((String)this.con.currentMember, RichJsonConstants.ARRAY_WILDCARD)) {
                        // Regex für [ oder ]
                        var arrayParts = ((String)this.con.currentMember).split("[\\[\\]]", 3);
                        this.con.currentMember = arrayParts[0];
                        var result = RichJsonCommandHolder.executeCommand(this.con.currentCommand, this, this.con);
                        this.con.currentMember = RichJsonHelper.getFieldByKey(result, arrayParts[1].trim());
                    } else {
                        this.con.currentMember = RichJsonCommandHolder.executeCommand(this.con.currentCommand, this, this.con);
                    }
                } else {
                    return unresolved_command + this.con.currentMember;
                }
            }

            if (pipe_commands != null) {
                var originalRoot = this.con.root;
                for (var pipe_cmd : pipe_commands) {
                    var parts = pipe_cmd.split(RichJsonConstants.COMMAND_SUFFIX, 2);
                    var cmdName = (parts.length == 1) ? RichJsonConstants.COMMAND_REF : parts[0].trim();
                    var memberVal = (parts.length == 1) ? parts[0].trim() : parts[1].trim();
                    this.con.root = this.con.currentMember;
                    this.con.currentCommand = cmdName;
                    this.con.currentMember = memberVal;
                    this.con.currentMember = this.__tryRichJsonCommand();
                }
                this.con.root = originalRoot;
            }
            return this.con.currentMember;
        } catch (Exception e) {
            throw new RuntimeException("RichJson command error in " + this.con.currentName, e);
        }
    }

    private boolean __isRichJsonCommandEnabled(String command) {
        return RichJsonCommandHolder.isCommandEnabled(command);
    }

    @SuppressWarnings("unchecked")
    private void __executeClone() {
        if (this.con.currentMember instanceof Map) {
            var map = (Map<String, Object>) this.con.currentMember;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER)) {
                // Hier ein 'new ArrayList<>()' drumherum packen
                var kcmds = new ArrayList<>((List<String>) map.get(RichJsonConstants.KEY_COMMAND_MEMBER));

                if (kcmds.contains(RichJsonConstants.COMMAND_CLONE) && this.__isRichJsonCommandEnabled(RichJsonConstants.COMMAND_CLONE)) {
                    this.con.currentCommand = RichJsonConstants.COMMAND_CLONE;
                    this.con.currentMember = this.__tryRichJsonKeyCommand();

                    // Jetzt klappt das remove()
                    kcmds.remove(RichJsonConstants.COMMAND_CLONE);

                    // Die modifizierte Liste wieder zurück in die Map schreiben
                    ((Map<String, Object>) this.con.currentMember).put(RichJsonConstants.KEY_COMMAND_MEMBER, kcmds);
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void __callConstructor() {
        if (RichJsonConfig.lateConstructorEnabled && this.con.currentMember instanceof Map) {
            var map = (Map<String, Object>) this.con.currentMember;
            if (map.containsKey(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER)) {
                var clazz = (Class<?>) map.remove(RichJsonConstants.LATE_CONSTRUCTOR_MEMBER);
                try {
                    var instance = clazz.getDeclaredConstructor().newInstance();
                    var updatedInstance = mapper.updateValue(instance, map);
                    this.con.currentMember = mapper.convertValue(updatedInstance, Map.class);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void __resolveInheritances() {
        var iteStr = (String) RichJsonHelper.getFieldByKey(this.cache.inheritances, this.con.currentAddress);
        if (iteStr == null) return;

        var chain = iteStr.split(RichJsonConstants.COMMAND_DELIMITER);
        var member = (Map<String, Object>) this.con.currentMember;

        for (var entry : chain) {
            var currentEntry = entry.trim();
            if (RichJsonHelper.matchesWildcard(currentEntry, RichJsonConstants.COMMAND_WILDCARD)) {
                var parts = currentEntry.split(RichJsonConstants.COMMAND_SUFFIX, 2);
                this.con.currentCommand = parts[0].trim();
                this.con.currentMember = parts[1].trim();
            } else {
                this.con.currentCommand = RichJsonConstants.COMMAND_REF;
                this.con.currentMember = currentEntry;
            }
            var result = RichJsonHelper.cloneObject(this.__tryRichJsonCommand());
            this.con.currentMember = RichJsonHelper.mergeIntoTarget(member, result);
        }
    }

    private void __resetCloneIfPossible(String address) {
        if (this.__isCloneApplying() && address.equals(this.cache.cloneAddress)) {
            this.cache.cloneAddress = null;
        }
    }

    private boolean __isCloneApplying() {
        return this.cache.cloneAddress != null;
    }

    @SuppressWarnings("unchecked")
    private Object __executeKeyCommands() {
        if (this.con.currentMember instanceof Map) {
            var map = (Map<String, Object>) this.con.currentMember;
            if (map.containsKey(RichJsonConstants.KEY_COMMAND_MEMBER)) {
                var kcmds = new ArrayList<String>((List<String>) map.get(RichJsonConstants.KEY_COMMAND_MEMBER));
                for (var i = 0; i < kcmds.size(); i++) {
                    var command = kcmds.get(i);
                    if (this.__isRichJsonCommandEnabled(command)) {
                        this.con.currentCommand = command;
                        this.con.currentMember = this.__tryRichJsonKeyCommand();
                        kcmds.remove(i);
                        i--;
                    }
                }
                if (this.con.currentMember instanceof Map) {
                    var resMap = (Map<String, Object>) this.con.currentMember;
                    if (kcmds.isEmpty()) resMap.remove(RichJsonConstants.KEY_COMMAND_MEMBER);
                    else resMap.put(RichJsonConstants.KEY_COMMAND_MEMBER, kcmds);
                }
            }
        }
        return this.con.currentMember;
    }

    private Object __tryRichJsonKeyCommand() {
        try {
            return RichJsonCommandHolder.executeCommand(this.con.currentCommand, this, this.con);
        } catch (Exception e) {
            throw new RuntimeException("RichJson key command error: " + this.con.currentName, e);
        }
    }

    private static class InterpolationData {
        StringBuilder rv = new StringBuilder();
        boolean isParsed = true;
    }

    private static class InterpolationResult {
        String result;
        boolean isParsed;
        InterpolationResult(String result, boolean isParsed) { this.result = result; this.isParsed = isParsed; }
    }
}