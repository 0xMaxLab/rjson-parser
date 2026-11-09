cmake_minimum_required(VERSION 3.15)
project(rjson_parser VERSION 1.3.0 LANGUAGES CXX)

option(RJSON_BUILD_TESTS "Build the RichJSON C++ tests (requires GTest)" ${PROJECT_IS_TOP_LEVEL})

find_package(nlohmann_json 3.11 REQUIRED)

# Library
file(GLOB_RECURSE RJSON_SOURCES CONFIGURE_DEPENDS
        ${CMAKE_CURRENT_SOURCE_DIR}/src/c++/main/*.cpp)

add_library(rjson_parser ${RJSON_SOURCES})
add_library(rjson::parser ALIAS rjson_parser)

target_compile_features(rjson_parser PUBLIC cxx_std_17)
target_include_directories(rjson_parser PUBLIC
        $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/src/c++/main>
        $<INSTALL_INTERFACE:include/rjson>)
target_link_libraries(rjson_parser PUBLIC nlohmann_json::nlohmann_json)
set_target_properties(rjson_parser PROPERTIES
        EXPORT_NAME parser
        WINDOWS_EXPORT_ALL_SYMBOLS ON)

# Tests
if(RJSON_BUILD_TESTS)
    find_package(GTest REQUIRED)
    enable_testing()
    add_executable(rjson_tests src/c++/test/RichJsonTest.cpp)
    target_link_libraries(rjson_tests PRIVATE rjson::parser GTest::gtest)
    add_test(NAME RichJsonTest
            COMMAND rjson_tests
            WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}")
endif()

# Install / export, so consumers can use find_package(rjson_parser)
include(GNUInstallDirs)
include(CMakePackageConfigHelpers)

install(TARGETS rjson_parser
        EXPORT rjson_parserTargets
        ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
        LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})

install(DIRECTORY src/c++/main/
        DESTINATION include/rjson
        FILES_MATCHING PATTERN "*.hpp")

install(EXPORT rjson_parserTargets
        NAMESPACE rjson::
        DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/rjson_parser)

configure_package_config_file(
        cmake/rjson_parserConfig.cmake.in
        ${CMAKE_CURRENT_BINARY_DIR}/rjson_parserConfig.cmake
        INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/rjson_parser)
write_basic_package_version_file(
        ${CMAKE_CURRENT_BINARY_DIR}/rjson_parserConfigVersion.cmake
        COMPATIBILITY SameMajorVersion)
install(FILES
        ${CMAKE_CURRENT_BINARY_DIR}/rjson_parserConfig.cmake
        ${CMAKE_CURRENT_BINARY_DIR}/rjson_parserConfigVersion.cmake
        DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/rjson_parser)
