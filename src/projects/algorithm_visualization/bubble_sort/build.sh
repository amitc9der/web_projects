emcc bubble_sort.c -o index.html \
-I/home/c9der/raylib/src \
/home/c9der/raylib/src/libraylib.web.a \
-s USE_GLFW=3 -s ASYNCIFY -s TOTAL_MEMORY=134217728 \
-DPLATFORM_WEB --shell-file ./shell.html

