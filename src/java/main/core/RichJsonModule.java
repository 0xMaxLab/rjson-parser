package core;

import commands.RichJsonCommand;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Represents a modular collection of RichJson commands and configurations.
 * Modules allow for grouping related logic, defining late-apply rules, and
 * managing command visibility (include/exclude).
 */
public class RichJsonModule {
    public String name;
    public List<String> lateApplies = new ArrayList<>();
    public Map<String, RichJsonCommand> commands = new HashMap<>();
    public Map<String, List<String>> kcmdIgnores = new HashMap<>();
    public boolean isIncluded = false;

    /**
     * Creates a new RichJson module with a specific name.
     *
     * @param name The unique name of the module.
     */
    public RichJsonModule(String name) {
        this.name = name;
    }

    /**
     * Registers a command that is flagged for late application.
     * This adds the command name to the late application queue and defines its
     * execution logic and ignore rules.
     *
     * @param name    The unique identifier for the command.
     * @param func    The command logic to execute.
     * @param ignores A list of command names that should be disabled when this command is active.
     * @return The current instance for method chaining.
     */
    public RichJsonModule addLateApply(String name, RichJsonCommand func, List<String> ignores) {
        this.lateApplies.add(name);
        if (ignores != null) {
            this.kcmdIgnores.put(name, ignores);
        }
        return this.addCommand(name, func, ignores);
    }

    /**
     * Adds a standard command to the module registry.
     *
     * @param name    The unique identifier for the command.
     * @param func    The command logic to execute.
     * @param ignores Optional list of commands to ignore during execution.
     * @return The current instance for method chaining.
     */
    public RichJsonModule addCommand(String name, RichJsonCommand func, List<String> ignores) {
        this.commands.put(name, func);
        if (ignores != null) {
            this.kcmdIgnores.put(name, ignores);
        }
        return this;
    }

    /**
     * Includes the module into the global RichJson system.
     * Registers all commands and late-apply rules into the RichJsonCommandHolder.
     * * @throws RuntimeException if the module attempts to override a built-in command.
     */
    public void include() {
        var holder = RichJsonCommandHolder.INSTANCE;
        this.isIncluded = true;

        this.commands.forEach((name, func) -> {
            if (holder.builtIn.containsKey(name)) {
                throw new RuntimeException("RichJson: You cannot override built-in commands. Affected: '#" + name + "'");
            }
            holder.available.put(name, func);
            holder.enabled.put(name, func);
        });

        for (String name : this.lateApplies) {
            if (!RichJsonCommandHolder.lateApplies.contains(name)) {
                RichJsonCommandHolder.lateApplies.add(name);
            }
        }

        this.kcmdIgnores.forEach((name, ignored) -> {
            holder.kcmdIgnored.put(name, ignored);
        });
    }

    /**
     * Excludes the module from the system, removing its commands and rules.
     */
    public void exclude() {
        var holder = RichJsonCommandHolder.INSTANCE;
        this.isIncluded = false;

        this.lateApplies.forEach(RichJsonCommandHolder.lateApplies::remove);

        this.commands.keySet().forEach(name -> {
            holder.available.remove(name);
            holder.enabled.remove(name);
            holder.kcmdIgnored.remove(name);
        });
    }
}