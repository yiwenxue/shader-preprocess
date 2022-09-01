cmake_minimum_required(VERSION 3.22)

project (test CXX)

set (CMAKE_EXPORT_COMPILE_COMMANDS ON)
set (CMAKE_CXX_STANDARD 17)
set (CXX_STANDARD_REQUIRED ON)

find_package(liblzma REQUIRED)

add_library(common common.h common.cpp)
target_include_directories(common PUBLIC ${LIBLZMA_INCLUDE_DIRS})
target_link_libraries(common PRIVATE ${LIBLZMA_LIBRARIES})

add_executable(compress compress.cpp)
target_link_libraries(compress PRIVATE common)
add_executable(decompress decompress.cpp)
target_link_libraries(decompress PRIVATE common)
add_executable(pack pack.cpp)
target_link_libraries(pack PRIVATE common)

# add_executable(program1 program1.cpp)
# target_link_libraries(program1 PRIVATE common)
add_executable(program2 program2.cpp)
target_link_libraries(program2 PRIVATE common)
# add_executable(program3 program3.cpp)
# target_link_libraries(program3 PRIVATE common)