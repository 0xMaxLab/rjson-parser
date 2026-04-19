package core;

import commands.*;
import helper.RichJsonLogger;
import org.slf4j.Logger;
import other.RichJsonConfig;

import java.util.*;

public class RichJsonCommandHolder {
    private static final Logger LOGGER = RichJsonLogger.logger;
    public static final RichJsonCommandHolder INSTANCE = new RichJsonCommandHolder();
    public static final RichJsonCommand VOID_COMMAND = (p, c) -> null;

    public Map<String, RichJsonCommand> available = new HashMap<>();
    public Map<String, RichJsonCommand> enabled = new HashMap<>();
    public Map<String, RichJsonCommand> builtIn = new HashMap<>();
    public Map<String, List<String>> kcmdIgnored = new HashMap<>();
    public static List<String> lateApplies = new ArrayList<>();

    public RichJsonCommandHolder() {
        this.registerBuiltInCommands();

        this.enabled.putAll(this.available);
        this.builtIn.putAll(this.available);
    }

    private void registerBuiltInCommands() {
        this.available.put("ref", new RichJson_ref());
        this.available.put("this", new RichJson_this());
        this.available.put("env", new RichJson_env());
        this.available.put("merge", new RichJson_merge());
        this.available.put("copy", new RichJson_copy());
        this.available.put("clone", new RichJson_clone());
        this.available.put("file", new RichJson_file());
        this.available.put("folder", new RichJson_folder());
        this.available.put("merge_folder", new RichJson_merge_folder());
        this.available.put("invoke", new RichJson_invoke());
    }

    /**
     * Führt einen Command aus, falls er aktiviert ist.
     */
    public static Object executeCommand(String commandName, RichJsonParser parser, RichJsonContext context) throws Exception {
        var holder = RichJsonCommandHolder.INSTANCE;
        var cmd = holder.enabled.get(commandName);

        if (cmd == null || cmd == VOID_COMMAND) {
            return RichJsonConstants.COMMAND_PREFIX + commandName + RichJsonConstants.COMMAND_SUFFIX + context.currentMember;
        }

        return cmd.execute(parser, context);
    }

    /**
     * Aktiviert oder deaktiviert einen Command.
     */
    public static void setCommandEnabled(String command, boolean isEnabled) {
        var holder = RichJsonCommandHolder.INSTANCE;

        if (!holder.available.containsKey(command)) {
            throwCommandNotFound(command);
        }

        if (isEnabled) {
            holder.enabled.put(command, holder.available.get(command));
        } else {
            holder.enabled.put(command, VOID_COMMAND);
        }

        if (RichJsonConfig.debugEnabled) {
            LOGGER.debug("RichJson command '" + command + "' was " + (isEnabled ? "enabled" : "disabled") + ".");
        }
    }

    public static boolean isCommandEnabled(String command) {
        var holder = RichJsonCommandHolder.INSTANCE;
        if (!holder.available.containsKey(command)) {
            throwCommandNotFound(command);
        }
        return holder.enabled.get(command) != VOID_COMMAND;
    }

    public static void throwCommandNotFound(String command) {
        throw new RuntimeException("RichJson Command '" + command + "' not found");
    }
}