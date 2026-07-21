cmake_minimum_required(VERSION 4.2)
project(rjson_parser)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(nlohmann_json REQUIRED)
find_package(GTest REQUIRED)
enable_testing()

file(GLOB_RECURSE RJSON_MAIN_SOURCES CONFIGURE_DEPENDS
        ${CMAKE_CURRENT_SOURCE_DIR}/src/c++/main/*.cpp)

add_executable(rjson_parser
        src/c++/test/RichJsonTest.cpp
        ${RJSON_MAIN_SOURCES})

target_include_directories(rjson_parser PRIVATE src/c++/main)

add_test(NAME RichJsonTest
        COMMAND rjson_parser
        WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}")

target_link_libraries(rjson_parser
        PRIVATE nlohmann_json::nlohmann_json
        GTest::gtest
        GTest::gtest_main
        pthread
)
