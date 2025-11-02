#include "raylib.h"
#include <emscripten/emscripten.h>


void UpdateDrawFrame(void);

//------------------------------------------------------------------------------------
// Program main entry point
//------------------------------------------------------------------------------------
int main(void)
{
    // Initialization
    //--------------------------------------------------------------------------------------
    // Make it resizable *and* start borderless
    SetConfigFlags(FLAG_WINDOW_RESIZABLE | FLAG_WINDOW_UNDECORATED);

    // Initialize with full screen size from the start
    InitWindow(GetMonitorWidth(0), GetMonitorHeight(0), "Full Window Raylib");
    SetTargetFPS(60);

    emscripten_set_main_loop(UpdateDrawFrame, 0, 1);

    // --------------------------------------------------------------------------------------
    CloseWindow();        
    // --------------------------------------------------------------------------------------

    return 0;
}


void UpdateDrawFrame(void){
    BeginDrawing();
        ClearBackground(BLACK);
        DrawText("Hello from the browser!", 190, 200, 20, RAYWHITE);
    EndDrawing();
}
