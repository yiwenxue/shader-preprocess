#include "common.h"

// I want to compress many files with index into one file and decompress them later.
void compress(const string &filename, const vector<string> &inputs) {
    lzma_stream strm = LZMA_STREAM_INIT;
    lzma_ret ret = lzma_easy_encoder(&strm, 9, LZMA_CHECK_CRC64);
    if (ret != LZMA_OK) {
        cout << "lzma_easy_encoder failed" << endl;
        return;
    }

    ofstream out(filename, std::ios::binary);
    if (!out) {
        cout << "Can't open file " << filename << endl;
        return;
    }

    for (const string &input : inputs) {
        ifstream in(input, std::ios::binary);
        if (!in) {
            cout << "Can't open file " << input << endl;
            return;
        }

        // Write file name
        uint32_t nameSize = input.size();
        out.write(reinterpret_cast<char *>(&nameSize), sizeof(nameSize));
        out.write(input.c_str(), nameSize);

        // Write file size
        in.seekg(0, std::ios::end);
        uint32_t size = in.tellg();
        in.seekg(0, std::ios::beg);
        out.write(reinterpret_cast<char *>(&size), sizeof(size));

        // Write file data
        vector<char> buffer(size);
        in.read(buffer.data(), size);
        strm.next_in = reinterpret_cast<uint8_t *>(buffer.data());
        strm.avail_in = size;

        do {
            uint8_t outBuffer[4096];
            strm.next_out = outBuffer;
            strm.avail_out = sizeof(outBuffer);

            ret = lzma_code(&strm, LZMA_RUN);
            if (ret != LZMA_OK && ret != LZMA_STREAM_END) {
                cout << "lzma_code failed" << endl;
                return;
            }

            out.write(reinterpret_cast<char *>(outBuffer), sizeof(outBuffer) - strm.avail_out);
        } while (strm.avail_in > 0 || strm.avail_out == 0);
    }

    lzma_end(&strm);
}

// I want to decompress lzma2 file with index into many files.
void decompress(const string &filename) {
    lzma_stream strm = LZMA_STREAM_INIT;
    lzma_ret ret = lzma_stream_decoder(&strm, UINT64_MAX, 0);
    if (ret != LZMA_OK) {
        cout << "lzma_stream_decoder failed" << endl;
        return;
    }

    ifstream in(filename, std::ios::binary);
    if (!in) {
        cout << "Can't open file " << filename << endl;
        return;
    }

    while (true) {
        // Read file name
        uint32_t nameSize;
        in.read(reinterpret_cast<char *>(&nameSize), sizeof(nameSize));
        if (in.eof()) {
            break;
        }

        vector<char> nameBuffer(nameSize);
        in.read(nameBuffer.data(), nameSize);
        string name(nameBuffer.data(), nameSize);

        // Read file size
        uint32_t size;
        in.read(reinterpret_cast<char *>(&size), sizeof(size));

        // Read file data
        vector<char> buffer(size);
        in.read(buffer.data(), size);
        strm.next_in = reinterpret_cast<uint8_t *>(buffer.data());
        strm.avail_in = size;

        ofstream out(name, std::ios::binary);
        if (!out) {
            cout << "Can't open file " << name << endl;
            return;
        }

        do {
            uint8_t outBuffer[4096];
            strm.next_out = outBuffer;
            strm.avail_out = sizeof(outBuffer);

            ret = lzma_code(&strm, LZMA_RUN);
            if (ret != LZMA_OK && ret != LZMA_STREAM_END) {
                cout << "lzma_code failed" << endl;
                return;
            }

            out.write(reinterpret_cast<char *>(outBuffer), sizeof(outBuffer) - strm.avail_out);
        } while (strm.avail_in > 0 || strm.avail_out == 0);
    }

    lzma_end(&strm);
}


// check if the file exists
bool fileExists(const std::string &filename) {
    struct stat buffer;
    return (stat(filename.c_str(), &buffer) == 0);
}

bool filenotExists(const std::string &filename) {
  return !fileExists(filename);
}

string escapeString(const string &input) {
    string result;
    for (char c : input) {
        if (c == '\\') {
            result += "\\\\";
        } else if (c == '"') {
            result += "\\\"";
        } else {
            result += c;
        }
    }

    return result;
}

string unescapeString(const string &input) {
    string result;
    for (size_t i = 0; i < input.size(); ++i) {
        if (input[i] == '\\') {
            if (i + 1 < input.size()) {
                if (input[i + 1] == '\\') {
                    result += '\\';
                    ++i;
                } else if (input[i + 1] == '"') {
                    result += '"';
                    ++i;
                } else {
                    result += input[i];
                }
            } else {
                result += input[i];
            }
        } else {
            result += input[i];
        }
    }

    return result;
}

// I want to pack a dictionary into a string using Escape String Syntax and unpack it later.
bool packDict(const Dict &dict, string &output) {
    output.clear();
    for (const auto &pair : dict) {
        output += escapeString(pair.first) + "\n" + escapeString(pair.second) + "\n";
    }

    return true;
}

bool unpackDict(const string &input, Dict &dict) {
    dict.clear();
    size_t pos = 0;
    while (pos < input.size()) {
        size_t end = input.find('\n', pos);
        if (end == string::npos) {
            return false;
        }

        string key = unescapeString(input.substr(pos, end - pos));
        pos = end + 1;
        end = input.find('\n', pos);
        if (end == string::npos) {
            return false;
        }

        string value = unescapeString(input.substr(pos, end - pos));
        pos = end + 1;
        dict[key] = value;
    }

    return true;
}
