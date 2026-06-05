using System;
using System.Collections.Generic;
using main.core;
using main.coreore;

namespace main.module
{
    /// <summary>
    /// Represents a modular collection of RichJson commands and configurations.
    /// Modules allow for grouping related logic, defining late-apply rules, and
    /// managing command visibility (include/exclude).
    /// </summary>
    public class RichJsonModule
    {
        public string Name { get; set; }
        public List<string> LateApplies { get; set; } = new List<string>();
        public Dictionary<string, RichJsonCommand> Commands { get; set; } = new Dictionary<string, RichJsonCommand>();
        public Dictionary<string, List<string>> KcmdIgnores { get; set; } = new Dictionary<string, List<string>>();
        public bool IsIncluded { get; set; } = false;

        /// <summary>
        /// Creates a new RichJson module with a specific name.
        /// </summary>
        /// <param name="name">The unique name of the module.</param>
        public RichJsonModule(string name)
        {
            this.Name = name;
        }

        /// <summary>
        /// Registers a command that is flagged for late application.
        /// This adds the command name to the late application queue and defines its
        /// execution logic and ignore rules.
        /// </summary>
        /// <param name="name">The unique identifier for the command.</param>
        /// <param name="func">The command logic to execute.</param>
        /// <param name="ignores">A list of command names that should be disabled when this command is active.</param>
        /// <returns>The current instance for method chaining.</returns>
        public RichJsonModule AddLateApply(string name, RichJsonCommand func, List<string> ignores)
        {
            this.LateApplies.Add(name);
            if (ignores != null)
            {
                this.KcmdIgnores[name] = ignores;
            }
            return this.AddCommand(name, func, ignores);
        }

        /// <summary>
        /// Adds a standard command to the module registry.
        /// </summary>
        /// <param name="name">The unique identifier for the command.</param>
        /// <param name="func">The command logic to execute.</param>
        /// <param name="ignores">Optional list of commands to ignore during execution.</param>
        /// <returns>The current instance for method chaining.</returns>
        public RichJsonModule AddCommand(string name, RichJsonCommand func, List<string> ignores)
        {
            this.Commands[name] = func;
            if (ignores != null)
            {
                this.KcmdIgnores[name] = ignores;
            }
            return this;
        }

        /// <summary>
        /// Includes the module into the global RichJson system.
        /// Registers all commands and late-apply rules into the RichJsonCommandHolder.
        /// </summary>
        /// <exception cref="Exception">Thrown if the module attempts to override a built-in command.</exception>
        public void Include()
        {
            var holder = RichJsonCommandHolder.INSTANCE;
            this.IsIncluded = true;

            foreach (var kvp in this.Commands)
            {
                string name = kvp.Key;
                RichJsonCommand func = kvp.Value;

                if (holder.BuiltIn.ContainsKey(name))
                {
                    throw new Exception("RichJSON: You cannot override built-in commands. Affected: '#" + name + "'");
                }
                holder.Available[name] = func;
                holder.Enabled[name] = func;
            }

            foreach (string name in this.LateApplies)
            {
                if (!RichJsonCommandHolder.LateApplies.Contains(name))
                {
                    RichJsonCommandHolder.LateApplies.Add(name);
                }
            }

            foreach (var kvp in this.KcmdIgnores)
            {
                holder.KcmdIgnored[kvp.Key] = kvp.Value;
            }
        }

        /// <summary>
        /// Excludes the module from the system, removing its commands and rules.
        /// </summary>
        public void Exclude()
        {
            var holder = RichJsonCommandHolder.INSTANCE;
            this.IsIncluded = false;

            this.LateApplies.ForEach(name => RichJsonCommandHolder.LateApplies.Remove(name));

            foreach (string name in this.Commands.Keys)
            {
                holder.Available.Remove(name);
                holder.Enabled.Remove(name);
                holder.KcmdIgnored.Remove(name);
            }
        }
    }
}