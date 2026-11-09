import os

from conan import ConanFile
from conan.tools.build import check_min_cppstd
from conan.tools.cmake import CMake, CMakeDeps, CMakeToolchain, cmake_layout
from conan.tools.files import copy

required_conan_version = ">=2.0"


class RjsonParserConan(ConanFile):
    name = "rjson-parser"
    version = "1.3.0"
    description = "RichJSON: JSON with inheritance, references and commands"
    license = "MIT"
    url = "https://github.com/0xMaxLab/rjson-parser"
    homepage = "https://github.com/0xMaxLab/rjson-parser"
    topics = ("json", "parser", "configuration", "references", "inheritance")
    package_type = "library"
    settings = "os", "arch", "compiler", "build_type"
    options = {"shared": [True, False], "fPIC": [True, False]}
    default_options = {"shared": False, "fPIC": True}

    exports_sources = "CMakeLists.txt", "cmake/*", "src/c++/main/*", "LICENSE"

    def config_options(self):
        if self.settings.os == "Windows":
            del self.options.fPIC

    def configure(self):
        if self.options.shared:
            self.options.rm_safe("fPIC")

    def layout(self):
        cmake_layout(self)

    def requirements(self):
        # Public headers include <nlohmann/json.hpp>
        self.requires("nlohmann_json/3.12.0", transitive_headers=True)

    def validate(self):
        check_min_cppstd(self, 17)

    def generate(self):
        tc = CMakeToolchain(self)
        tc.cache_variables["RJSON_BUILD_TESTS"] = False
        tc.generate()
        CMakeDeps(self).generate()

    def build(self):
        cmake = CMake(self)
        cmake.configure()
        cmake.build()

    def package(self):
        copy(self, "LICENSE", self.source_folder, os.path.join(self.package_folder, "licenses"))
        cmake = CMake(self)
        cmake.install()

    def package_info(self):
        self.cpp_info.set_property("cmake_file_name", "rjson_parser")
        self.cpp_info.set_property("cmake_target_name", "rjson::parser")
        self.cpp_info.libs = ["rjson_parser"]
        self.cpp_info.includedirs = ["include/rjson"]
        if self.settings.os in ["Linux", "FreeBSD"]:
            self.cpp_info.system_libs = ["m", "pthread"]
