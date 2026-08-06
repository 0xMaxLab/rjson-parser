#include "RichJsonEnvironment.hpp"
#include "../core/RichJsonConstants.hpp"
#include <stdexcept>

namespace RichJson {

void RichJsonEnvironment::addEnvironmentVariable(const std::string& name, const json& value) {
    if (name == RichJsonConstants::KEY_COMMAND_MEMBER) return;

    if (hasEnv(name) || hasFunction(name)) {
        throw std::runtime_error("RichJson has the env variable '" + name + "' already defined");
    }

    env()[name] = value;
}

void RichJsonEnvironment::addEnvironmentVariables(const json& envs) {
    if (envs.is_null()) return;

    for (auto it = envs.begin(); it != envs.end(); ++it) {
        addEnvironmentVariable(it.key(), it.value());
    }
}

void RichJsonEnvironment::registerFunction(const std::string& name, std::function<json()> fn) {
    if (hasEnv(name) || hasFunction(name)) {
        throw std::runtime_error("RichJson has the env variable '" + name + "' already defined");
    }

    functions()[name] = std::move(fn);
}

}
