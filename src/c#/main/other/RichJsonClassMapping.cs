using System;
using System.Collections.Generic;
using main.helper;

namespace main.other
{
    public static class RichJsonClassMapping
    {
        private static readonly Dictionary<string, Type> RICH_JSON_CLASS_MAPPING = new Dictionary<string, Type>();

        /// <summary>
        /// Adds the given class mappings.
        /// </summary>
        /// <param name="classMappings">A dictionary containing the class names as keys and the types as values.</param>
        public static void AddClassMappings(Dictionary<string, Type> classMappings)
        {
            foreach (var entry in classMappings)
            {
                AddClassMapping(entry.Key, entry.Value);
            }
        }

        /// <summary>
        /// Adds the given class to the mapping table.
        /// </summary>
        /// <param name="name">The name to associate with the class type.</param>
        /// <param name="classType">The class type to map.</param>
        public static void AddClassMapping(string name, Type classType)
        {
            if (RICH_JSON_CLASS_MAPPING.ContainsKey(name))
            {
                // Note: Ensure your RichJsonLogger has a Warn method, or route this to Info/Error
                RichJsonLogger.Logger.Error("has the class '" + name + "' already defined");
            }
            else
            {
                RICH_JSON_CLASS_MAPPING[name] = classType;
            }
        }

        /// <summary>
        /// Retrieves the mapped class by its name.
        /// </summary>
        /// <param name="name">The name of the class to retrieve.</param>
        /// <returns>The mapped Type object.</returns>
        /// <exception cref="ArgumentException">Thrown if the class name is not found in the mapping.</exception>
        public static Type MapClassByName(string name)
        {
            if (!RICH_JSON_CLASS_MAPPING.ContainsKey(name))
            {
                throw new ArgumentException("RichJSON could not find the class called '" + name + "'.\nMake sure its defined in RichJsonClassMapping.");
            }
            return RICH_JSON_CLASS_MAPPING[name];
        }
    }
}