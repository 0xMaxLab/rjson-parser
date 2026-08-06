#ifndef RICH_JSON_LOGGER_HPP
#define RICH_JSON_LOGGER_HPP

#include "../other/RichJsonConfig.hpp"
#include <chrono>
#include <iostream>
#include <string>

namespace RichJson {

class RichJsonLogger {
public:
    explicit RichJsonLogger(std::string label) : label_(std::move(label)) {}

    void info(const std::string& message) {
        if (__RICH_JSON_CONFIG.infoEnabled) {
            std::cout << padding_ << label_ << " " << message << "\n";
        }
    }

    void debug(const std::string& message) {
        if (__RICH_JSON_CONFIG.debugEnabled) {
            std::cout << padding_ << label_ << " " << message << "\n";
        }
    }

    void error(const std::string& message) {
        std::cerr << padding_ << label_ << " " << message << "\n";
    }

    void groupStart() {
        if (__RICH_JSON_CONFIG.infoEnabled || __RICH_JSON_CONFIG.debugEnabled) {
            groupLevel_++;
            padding_ += "  ";
        }
    }

    void groupEnd() {
        if ((__RICH_JSON_CONFIG.infoEnabled || __RICH_JSON_CONFIG.debugEnabled) && padding_.size() >= 2) {
            groupLevel_--;
            padding_.resize(padding_.size() - 2);
        }
    }

    void groupEndAll() {
        for (int i = 0; i < groupLevel_; i++) {
            if (padding_.size() >= 2) padding_.resize(padding_.size() - 2);
        }
        groupLevel_ = 0;
    }

    void timeStart() {
        if (__RICH_JSON_CONFIG.debugEnabled) {
            startTime_ = std::chrono::steady_clock::now();
        }
    }

    void timeEnd() {
        if (__RICH_JSON_CONFIG.debugEnabled) {
            auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
                std::chrono::steady_clock::now() - startTime_).count();
            debug(std::to_string(ns) + " ns");
        }
    }

private:
    std::string label_;
    std::string padding_;
    int groupLevel_ = 0;
    std::chrono::steady_clock::time_point startTime_;
};

}

#endif
