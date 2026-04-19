package helper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import other.RichJsonConfig;

/**
 * SLF4J implementation of the RichJsonLogger.
 * Uses System.nanoTime() for precise performance tracking.
 */
public class RichJsonLogger {
    public static final Logger logger = LoggerFactory.getLogger(RichJsonLogger.class);

    private final String label;
    private static String padding = "";
    private int groupLevel = 0;
    private long startTime;
    private long endTime;

    public RichJsonLogger(String label) {
        this.label = label;
    }

    public void info(String message) {
        if (RichJsonConfig.infoEnabled && logger.isInfoEnabled()) {
            logger.info("{}{} {}", padding, label, message);
        }
    }

    public void debug(String message) {
        if (RichJsonConfig.debugEnabled && logger.isDebugEnabled()) {
            logger.debug("{}{} {}", padding, label, message);
        }
    }

    public void error(String message) {
        logger.error("{}{} {}", padding, label, message);
    }

    /**
     * Increases indentation for nested log groups.
     */
    public void groupStart() {
        if (RichJsonConfig.infoEnabled || RichJsonConfig.debugEnabled) {
            groupLevel++;
            padding += "  ";
        }
    }

    /**
     * Decreases indentation for nested log groups.
     */
    public void groupEnd() {
        if ((RichJsonConfig.infoEnabled || RichJsonConfig.debugEnabled) && padding.length() >= 2) {
            groupLevel--;
            padding = padding.substring(0, padding.length() - 2);
        }
    }

    /**
     * Resets indentation to zero.
     */
    public void groupEndAll() {
        for (int i = 0; i < groupLevel; i++) {
            padding = padding.substring(0, padding.length() - 2);
        }
        groupLevel = 0;
    }

    /**
     * Captures the starting timestamp in nanoseconds.
     */
    public void timeStart() {
        if (RichJsonConfig.debugEnabled) {
            this.startTime = System.nanoTime();
        }
    }

    /**
     * Captures the end timestamp and logs the duration.
     */
    public void timeEnd() {
        if (RichJsonConfig.debugEnabled) {
            this.endTime = System.nanoTime();
            this.debug((endTime - startTime) + " ns");
        }
    }
}
