emcc game.c -o game.html \
-I/home/c9der/raylib/src \
/home/c9der/raylib/src/libraylib.web.a \
-s USE_GLFW=3 -s ASYNCIFY -s TOTAL_MEMORY=134217728 \
-DPLATFORM_WEB --shell-file /home/c9der/raylib/src/shell.html

