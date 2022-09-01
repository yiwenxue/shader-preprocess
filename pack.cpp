#include "common.h"


// all common characters used to write program
unsigned char charactermap[] = {
    ' ', '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
    '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_',
    '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~',
};

int main () {

    Dict dict;

    // generate random dictionary with 1000 entries for unit test purpose
    for (int i = 0; i < 10; ++i) {
        string key;
        string value;
        int keylen = rand() % 100 + 1;
        int valuelen = rand() % 1000 + 1;
        for (int j = 0; j < keylen; ++j) {
            key += charactermap[rand() % (sizeof(charactermap) / sizeof(charactermap[0]))];
        }
        for (int j = 0; j < valuelen; ++j) {
            value += charactermap[rand() % (sizeof(charactermap) / sizeof(charactermap[0]))];
        }
        dict[key] = value;
    }

    // test serialization
    string serialized;
    Dict dict2;
    string serialized2;

    if (serialized != serialized2) {
        std::cout << "output != output2" << std::endl;
    }
    // I want to compare the contents of dict and dict2.
    if (dict.size() == dict2.size()) {
        for (const auto &item : dict) {
            auto it = dict2.find(item.first);
            if (it == dict2.end()) {
                std::cout << "dict2 doesn't contain key \"" << item.first <<"\""<< std::endl;
            } else if (it->second != item.second) {
                std::cout << "dict2[" << item.first << "] != " << item.second << std::endl;
            }
        }
    } else {
        std::cout << "dict.size() != dict2.size()" << std::endl;
    }

    return 0;
}