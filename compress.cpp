#include "common.h"

int main(int argc, char **argv) {
  if (argc < 2) {
    std::cout << "Usage: " << argv[0] << " <file>" << std::endl;
    return 1;
  }

  vector<string> inputs(argv+1, argv+argc);

  auto it = std::find_if(inputs.begin(), inputs.end(), filenotExists);

  if (it != inputs.end()) {
    std::cout << *it << " doesn't exist" << std::endl;
    return 1;
  }

  const string output = "output.7z";

  compress(output, inputs);

  return 0;
}
