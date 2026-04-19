import {__RICH_JSON_CONFIG as _RICH_JSON_CONFIG} from "../other/RichJsonConfiguration.js";

export class RichJsonLogger {
    groupLevel = 0;

    constructor(label) {
        this._label = label;
        this._padding = "";
        this.start = null;
        this.end = null;
    }

    /**
     * Internal helper to format the message with level, label, and padding
     */
    _formatMessage(message) {
        return `${this._padding}${this._label} ${message}`;
    }

    info(message) {
        if (_RICH_JSON_CONFIG.infoEnabled) {
            console.info(this._formatMessage(message));
        }
    }

    debug(message) {
        if (_RICH_JSON_CONFIG.debugEnabled) {
            console.debug(this._formatMessage(message));
        }
    }

    error(message) {
        console.error(this._formatMessage(message));
    }

    groupStart(message) {
        if (_RICH_JSON_CONFIG.infoEnabled) {
            this.groupLevel++;
            console.group(this._formatMessage(message));
        }
    }

    groupStartDebug(message) {
        if (_RICH_JSON_CONFIG.debugEnabled) {
            this.groupLevel++;
            console.group(this._formatMessage(message));
        }
    }

    groupEnd() {
        if (_RICH_JSON_CONFIG.infoEnabled) {
            this.groupLevel--;
            console.groupEnd();
        }
    }

    groupEndDebug() {
        if (_RICH_JSON_CONFIG.debugEnabled) {
            this.groupLevel--;
            console.groupEnd();
        }
    }

    groupEndAll() {
        if (_RICH_JSON_CONFIG.infoEnabled || _RICH_JSON_CONFIG.debugEnabled) {
            for (let i = 0; i < this.groupLevel; i++) {
                console.groupEnd();
            }
        }
    }

    timeStart() {
        if (_RICH_JSON_CONFIG.debugEnabled) {
            this.start = performance.now();
        }
    }

    timeEnd() {
        if (_RICH_JSON_CONFIG.debugEnabled && this.start !== null) {
            this.end = performance.now();
            const durationNs = Math.round((this.end - this.start) * 1_000_000);
            this.debug(`${durationNs} ns`);
        }
    }
}