#include "raylib.h"
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <emscripten/emscripten.h>

#define NUM_BARS 15

// Declare globals
int values[NUM_BARS];
int i = 0, j = 0;
int swapped = 0;
bool sorted = false;

void UpdateDrawFrame(void);
void BubbleSortStep(int *array, int length);
void swap(int *a, int *b);

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

    srand(time(NULL));
    for (int i = 0; i < NUM_BARS; i++)
        values[i] = rand() % 600;

    emscripten_set_main_loop(UpdateDrawFrame, 0, 1);

    // --------------------------------------------------------------------------------------
    CloseWindow();
    // --------------------------------------------------------------------------------------

    return 0;
}

void UpdateDrawFrame(void)
{
    BubbleSortStep(values, NUM_BARS);
    BeginDrawing();
    ClearBackground(BLACK);

    // Draw bars
    for (int k = 0; k < NUM_BARS; k++)
    {
        Color color = RAYWHITE;
        if (k == j || k == j + 1)
            color = RED;

        int barWidth = 800 / NUM_BARS;
        int barHeight = values[k];
        int x = k * barWidth;
        int y = 600 - barHeight;

        DrawRectangle(x, y, barWidth - 2, barHeight, color);

        // Draw value text on top of the bar
        char text[8];
        sprintf(text, "%d", values[k]);

        int textWidth = MeasureText(text, 10);
        DrawText(text, x + (barWidth - textWidth) / 2, y - 12, 10, RAYWHITE);
    }

    if (sorted)
        DrawText("SORTED!", 20, 20, 40, GREEN);

    EndDrawing();
}

// instead of bubble sort we implmenet bubble sort step by step for visualization
void BubbleSortStep(int *array, int length)
{
    if (sorted)
        return;

    if (i < length - 1)
    {
        if (j < length - i - 1)
        {
            if (array[j] > array[j + 1])
            {
                // swap
                swap(&array[j], &array[j + 1]);
                swapped = 1;
            }
            (j)++;
        }
        else
        {
            if (swapped == 0)
            {
                sorted = true;
                i = length;
            }
            j = 0;
            (i)++;
        }
    }
    else
    {
        sorted = true;
    }
}

void swap(int *a, int *b)
{
    int temp = *a;
    *a = *b;
    *b = temp;
}