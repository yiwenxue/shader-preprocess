#pragma once

#include <lzma.h>

#include <iostream>
#include <string>
#include <fstream>
#include <vector>
#include <unordered_map>
#include <cstring>
#include <optional>
#include <variant>
#include <memory>

using std::string;
using std::cout;
using std::endl;
using std::ifstream;
using std::ofstream;
using std::vector;
using std::unordered_map;

typedef unordered_map<string, string> Dict;

void compress(const string &filename, const vector<string> &inputs);

void decompress(const string &filename);

bool fileExists(const std::string &filename);

bool filenotExists(const std::string &filename);

bool packDict(const Dict &dict, string &output);

bool unpackDict(const string &input, Dict &dict);

class Effect {
public:
    Effect();

    ~Effect();

    string &getShaderHeap() {
        return std::move(m_shaderHeap);
    }

    const string &getName() const {
        return m_name;
    }
    
    const string &getShaderSnippet() {
        return "";
    } 

private:

    string m_name;

    string m_shaderHeap;
};

using shared = std::shared_ptr;

using MacroValue = std::variant<bool, int32_t, string>;

struct Macro {
    string name;
    MacroValue value;
};

struct Define {
    string name;
    vector<MacroValue> range;
    MacroValue defaultValue;
};

using MacroRecord = std::vector<Macro>;
using DefineList = std::vector<Define>;

enum ShaderSourceType {
    GLSL, // GLSL for OpenGL/ES
    SPIRV, // SPIR-V for vulkan
    MSL, // Metal Shading Language for Metal
    CFX, // CgFX for DirectX
};

class ShaderSource {};

class ShaderSnippet {};

class CompileOptions {};

namespace gfx {
    class Attribute {};
    class DescriptorSet {};
    class DescriptorSetLayoutBinding {};
    class Shader {};
    class PipelineLayout {};

    using Attributes = std::vector<Attribute>;
    using DescriptorSetLayoutBindings = std::vector<DescriptorSetLayoutBinding>;
};

template<ShaderSourceType type>
class ShaderVariant {
    ShaderVariant(MacroRecord record);

    const string &getShaderSource() const; // get glsl shader source code

    const gfx::Shader* getGFXShader(); // compile if it's not compiled

    const MacroRecord &getMacroCombination() const;

    const gfx::Attributes &getAttributes() const;

private:
    ShaderSource m_source;
    ShaderSource m_binary;
};

// enum OptimizationLevel {
//     O0, // no optimization
//     O1, // optimize for performance
//     O2, // optimize for size
//     O3, // optimize for performance and size
// };

// class ShaderCompiler {
//     static ShaderCompiler *m_instance;
// public:
//     static ShaderCompiler *getInstance() {
//         if (m_instance == nullptr) {
//             m_instance = new ShaderCompiler();
//         }

//         return m_instance;
//     }

//     template<ShaderSourceType type>
//     ShaderSource compile(const ShaderSnippet &source, const MacroRecord &record, OptimizationLevel level);

// private:
//     // generate glsl shader source code
//     ShaderSource assembly(const ShaderSnippet &source, const MacroRecord &record);

//     ShaderSource compileSpirv(const ShaderSource &source);

//     ShaderSource optimization(const ShaderSource &source, OptimizationLevel level);

//     template<ShaderSourceType type>
//     ShaderSource crossCompile(const ShaderSource &source);
// };

// template <>
// ShaderSource ShaderCompiler::compile<GLSL>(const ShaderSnippet &source, const MacroRecord &record) {
//     return "";
// }

// template <>
// ShaderSource ShaderCompiler::compile<SPIRV>(const ShaderSnippet &source, const MacroRecord &record) {
//     return "";
// }

// template <>
// ShaderSource ShaderCompiler::compile<MSL>(const ShaderSnippet &source, const MacroRecord &record) {
//     return "";
// }

// template <>
// ShaderSource ShaderCompiler::compile<CFX>(const ShaderSnippet &source, const MacroRecord &record) {
//     return "";
// }

// #ifndef PREFER_REALTIME_SHADER
// #define PREFER_REALTIME_SHADER 0
// #endif

// class ShaderTemplate {
//     void initialize(const ShaderSnippet &source, const DefineList &defines) {}

//     const gfx::DescriptorSet &getGFXDescriptorSetLayout() const;

//     const gfx::DescriptorSetLayoutBindings &getDescriptorSetLayoutBindings() const;

//     const gfx::PipelineLayout &getGFXPipelineLayout() const;

//     // variant
//     template<ShaderSourceType type>
//     std::optional<ShaderVariant<type>> getShaderVariant(const MacroRecord &record);

//     // variant
//     const DefineList &getDefineList() const;

//     const gfx::Attributes &getAttributes() const;

//     const ShaderSnippet &getShaderSnippet() const;

// private:
// };

// class ProgramLib {
//     static ProgramLib *m_instance;
// public:
//     static ProgramLib *getInstance() {
//         if (m_instance == nullptr) {
//             m_instance = new ProgramLib();
//         }

//         return m_instance;
//     }

//     const ShaderTemplate &getShaderTemplate(const string &name);

//     void registerShaderTemplate(const string &name, const ShaderTemplate &template);
// };