package module;

import helper.RichJsonLogger;
import org.slf4j.Logger;
import other.RichJsonConfig;

import java.util.HashMap;
import java.util.Map;

public class RichJsonModuleManager {
    private static final Logger LOGGER = RichJsonLogger.logger;
    private static final Map<String, RichJsonModule> MODULES = new HashMap<>();

    public static RichJsonModule registerModule(RichJsonModule module) {
        if (RichJsonConfig.infoEnabled) {
            LOGGER.info("RichJSON: registering module '" + module.name + "'");
        }
        MODULES.put(module.name, module);
        return module;
    }

    public static void unregisterModule(String name) {
        if (isModuleRegistered(name)) {
            if (MODULES.get(name).isIncluded) {
                throw new RuntimeException("RichJSON: Cannot unregister module '" + name + "' while it is included.");
            }
            if (RichJsonConfig.infoEnabled) {
                LOGGER.info("RichJSON: unregistering module '" + name + "'");
            }
            MODULES.remove(name);
        }
    }

    public static boolean isModuleRegistered(String name) {
        return MODULES.containsKey(name);
    }

    public static void includeModule(String name) {
        if (isModuleRegistered(name)) {
            RichJsonModule module = MODULES.get(name);
            if (!module.isIncluded) {
                if (RichJsonConfig.infoEnabled) {
                    LOGGER.info("RichJSON: including module '" + name + "'");
                }
                module.include();
            }
        }
    }

    public static void excludeModule(String name) {
        if (isModuleRegistered(name)) {
            RichJsonModule module = MODULES.get(name);
            if (module.isIncluded) {
                if (RichJsonConfig.infoEnabled) {
                    LOGGER.info("RichJSON: excluding module '" + name + "'");
                }
                module.exclude();
            }
        }
    }
}