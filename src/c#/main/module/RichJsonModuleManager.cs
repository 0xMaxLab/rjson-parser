using System;
using System.Collections.Generic;
using main.helper;
using main.other;

namespace main.module
{
    public static class RichJsonModuleManager
    {
        private static readonly RichJsonLogger LOGGER = RichJsonLogger.Logger;
        private static readonly Dictionary<string, RichJsonModule> MODULES = new Dictionary<string, RichJsonModule>();

        public static RichJsonModule RegisterModule(RichJsonModule module)
        {
            if (RichJsonConfig.InfoEnabled)
            {
                LOGGER.Info("RichJSON: registering module '" + module.Name + "'");
            }
            MODULES[module.Name] = module;
            return module;
        }

        public static void UnregisterModule(string name)
        {
            if (IsModuleRegistered(name))
            {
                if (MODULES[name].IsIncluded)
                {
                    throw new Exception("RichJSON: Cannot unregister module '" + name + "' while it is included.");
                }
                if (RichJsonConfig.InfoEnabled)
                {
                    LOGGER.Info("RichJSON: unregistering module '" + name + "'");
                }
                MODULES.Remove(name);
            }
        }

        public static bool IsModuleRegistered(string name)
        {
            return MODULES.ContainsKey(name);
        }

        public static void IncludeModule(string name)
        {
            if (IsModuleRegistered(name))
            {
                RichJsonModule module = MODULES[name];
                if (!module.IsIncluded)
                {
                    if (RichJsonConfig.InfoEnabled)
                    {
                        LOGGER.Info("RichJSON: including module '" + name + "'");
                    }
                    module.Include();
                }
            }
        }

        public static void ExcludeModule(string name)
        {
            if (IsModuleRegistered(name))
            {
                RichJsonModule module = MODULES[name];
                if (module.IsIncluded)
                {
                    if (RichJsonConfig.InfoEnabled)
                    {
                        LOGGER.Info("RichJSON: excluding module '" + name + "'");
                    }
                    module.Exclude();
                }
            }
        }
    }
}