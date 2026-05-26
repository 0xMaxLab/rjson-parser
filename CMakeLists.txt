cmake_minimum_required(VERSION 4.2)
project(rjson_parser)

set(CMAKE_CXX_STANDARD 17)

find_package(nlohmann_json REQUIRED)
find_package(GTest REQUIRED)

add_executable(rjson_parser
        src/c++/test/RichJsonTest.cpp
        src/c++/main/helper/RichJsonHelper.h
        src/c++/main/helper/RichJsonHelper.cpp
        src/c++/main/core/RichJsonParser.cpp
        src/c++/main/core/RichJsonParser.hpp
        src/c++/main/core/RichJsonParser.hpp)

add_test(NAME RichJsonTest
        COMMAND rjson_parser
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}../../")

target_link_libraries(rjson_parser
        PRIVATE nlohmann_json::nlohmann_json
        GTest::gtest
        GTest::gtest_main
        pthread
)





