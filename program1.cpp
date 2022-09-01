#include "common.h"

template <ShaderSourceType type> 
ShaderSource getShaderVariant(const string &shaderHeap, const string &key);

class ShaderVariant {
public:
    ShaderVariant();
    ~ShaderVariant();

    template <ShaderSourceType type>
    ShaderSource getShader(const string &key) const {
        if (m_shaderHeap.find(key) != m_shaderHeap.end()) {
            return m_shaderHeap.at(key);
        } else {
            auto res = getShaderVariant<type>(m_shaderData, key);
            if (res) {
                // m_shaderHeap[key] = res.value();
                return res;
            } else {
                return std::nullopt;
            }
        }
    }

private:
    string m_shaderData;

    unordered_map<string, string> m_shaderHeap;
};

class ShaderLibrary {
    static ShaderLibrary *m_instance;
public:

    static ShaderLibrary *getInstance() {
        if (m_instance == nullptr) {
            m_instance = new ShaderLibrary();
        }

        return m_instance;
    }

    void registerEffect(Effect &effect) {
        m_bulks.emplace(effect.getName(), effect.getShaderHeap());
    }

    template <ShaderSourceType type>
    ShaderSource getShader(const string &name, const string &key) const {
        if (m_bulks.find(name) != m_bulks.end()) {
            return m_bulks.at(name).getShader<type>(key);
        } else {
            return std::nullopt;
        }
    }

private:
    ShaderLibrary() {}
    ~ShaderLibrary() {}

    unordered_map<string, ShaderVariant> m_bulks;
};

void test() {
    ShaderSource src = ShaderLibrary::getInstance()->getShader<GLSL>("effect", "main");
    if (src) {
        cout << src.value() << endl;
    }
}

template <>
ShaderSource getShaderVariant<GLSL>(const string &shaderHeap, const string &key) {
    return shaderHeap;
}

template <>
ShaderSource getShaderVariant<SPIRV>(const string &shaderHeap, const string &key) {
    return shaderHeap;
}

template <>
ShaderSource getShaderVariant<MSL>(const string &shaderHeap, const string &key) {
    return shaderHeap;
}

template <>
ShaderSource getShaderVariant<CFX>(const string &shaderHeap, const string &key) {
    return shaderHeap;
}

int main () {
    return 0;
}