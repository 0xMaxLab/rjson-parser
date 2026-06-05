using System;
using System.Collections.Generic;
using main.commands;
using main.coreore;
using main.helper;
using main.other;

namespace main.core
{
    public class RichJsonCommandHolder
    {
        private static readonly RichJsonLogger Logger = RichJsonLogger.Logger;
        public static readonly RichJsonCommandHolder INSTANCE = new RichJsonCommandHolder();
        public static readonly RichJsonCommand VOID_COMMAND = (p, c) => null;

        public Dictionary<string, RichJsonCommand> Available { get; set; } = new Dictionary<string, RichJsonCommand>();
        public Dictionary<string, RichJsonCommand> Enabled { get; set; } = new Dictionary<string, RichJsonCommand>();
        public Dictionary<string, RichJsonCommand> BuiltIn { get; set; } = new Dictionary<string, RichJsonCommand>();
        public Dictionary<string, List<string>> KcmdIgnored { get; set; } = new Dictionary<string, List<string>>();
        public static List<string> LateApplies { get; set; } = new List<string>();

        public RichJsonCommandHolder()
        {
            this.RegisterBuiltInCommands();

            foreach (var kvp in this.Available)
            {
                this.Enabled[kvp.Key] = kvp.Value;
                this.BuiltIn[kvp.Key] = kvp.Value;
            }
        }

        private void RegisterBuiltInCommands()
        {
            // Note: In C#, method invocation matching the anonymous class instances or functional wrappers
            // Assuming classes like RichJson_ref implement a method or can be implicitly converted to the delegate.
            // If they are classes with an Execute method, use: new RichJson_ref().Execute
            this.Available.Add("ref", new RichJson_ref().Execute);
            this.Available.Add("this", new RichJson_this().Execute);
            this.Available.Add("env", new RichJson_env().Execute);
            this.Available.Add("merge", new RichJson_merge().Execute);
            this.Available.Add("copy", new RichJson_copy().Execute);
            this.Available.Add("clone", new RichJson_clone().Execute);
            this.Available.Add("file", new RichJson_file().Execute);
            this.Available.Add("folder", new RichJson_folder().Execute);
            this.Available.Add("merge_folder", new RichJson_merge_folder().Execute);
            this.Available.Add("invoke", new RichJson_invoke().Execute);
        }

        /// <summary>
        /// Executes a command if it is enabled.
        /// </summary>
        public static object ExecuteCommand(string commandName, RichJsonParser parser, RichJsonContext context)
        {
            var holder = RichJsonCommandHolder.INSTANCE;
            holder.Enabled.TryGetValue(commandName, out var cmd);

            if (cmd == null || cmd == VOID_COMMAND)
            {
                return RichJsonConstants.COMMAND_PREFIX + commandName + RichJsonConstants.COMMAND_SUFFIX + context.CurrentMember;
            }

            return cmd(parser, context);
        }

        /// <summary>
        /// Enables or disables a command.
        /// </summary>
        public static void SetCommandEnabled(string command, bool isEnabled)
        {
            var holder = RichJsonCommandHolder.INSTANCE;

            if (!holder.Available.ContainsKey(command))
            {
                ThrowCommandNotFound(command);
            }

            if (isEnabled)
            {
                holder.Enabled[command] = holder.Available[command];
            }
            else
            {
                holder.Enabled[command] = VOID_COMMAND;
            }

            if (RichJsonConfig.DebugEnabled)
            {
                Logger.Debug("RichJson command '" + command + "' was " + (isEnabled ? "enabled" : "disabled") + ".");
            }
        }

        public static bool IsCommandEnabled(string command)
        {
            var holder = RichJsonCommandHolder.INSTANCE;
            if (!holder.Available.ContainsKey(command))
            {
                ThrowCommandNotFound(command);
            }
            return holder.Enabled[command] != VOID_COMMAND;
        }

        public static void ThrowCommandNotFound(string command)
        {
            throw new Exception("RichJson Command '" + command + "' not found");
        }
    }
}