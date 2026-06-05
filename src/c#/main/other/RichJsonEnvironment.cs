using System;
using System.Collections.Generic;
using main.core;

namespace main.other
{
    /// <summary>
    /// Manages the global environment variables (macros) for RichJson.
    /// </summary>
    public static class RichJsonEnvironment
    {
        public static readonly Dictionary<string, object> Env = new Dictionary<string, object>();

        /// <summary>
        /// Adds multiple constants to the environment.
        /// </summary>
        /// <param name="envs">A dictionary containing names and values.</param>
        public static void AddEnvironmentVariables(Dictionary<string, object> envs)
        {
            if (envs == null) return;

            foreach (var entry in envs)
            {
                AddEnvironmentVariable(entry.Key, entry.Value);
            }
        }

        /// <summary>
        /// Adds a single constant to the environment.
        /// </summary>
        /// <param name="name">The name of the variable.</param>
        /// <param name="value">The value of the variable.</param>
        /// <exception cref="Exception">Thrown if the environment variable name already exists.</exception>
        public static void AddEnvironmentVariable(string name, object value)
        {
            if (RichJsonConstants.KEY_COMMAND_MEMBER.Equals(name))
            {
                return;
            }

            if (Env.ContainsKey(name))
            {
                throw new Exception("RichJson has the env variable '" + name + "' already defined");
            }

            Env[name] = value;
        }
    }
}