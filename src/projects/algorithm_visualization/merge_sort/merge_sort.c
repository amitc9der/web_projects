// merge_sort_vis_.c
#include "raylib.h"
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <emscripten/emscripten.h>

#define NUM_BARS 80
#define MAX_VALUE 600
#define MIN_BAR_WIDTH 2

typedef enum {
    ST_IDLE,
    ST_SORTING,
    ST_DONE
} SortState;

static int values[NUM_BARS];
static int aux[NUM_BARS];
static int curr_size = 1;    // current size of subarrays to merge
static int left_start = 0;   // start index of the current merge
static int i_idx = 0, j_idx = 0, k_idx = 0;
static int mid = 0, right = 0;

static SortState state = ST_IDLE;
static bool paused = true;
static int speed = 2;

void ResetArray(void);
void ResetMergeIndices(void);
void NextMerge(void);
void DoMergeStep(void);
void UpdateDrawFrame(void);

void ResetArray(void) {
    srand((unsigned)time(NULL));
    for (int i = 0; i < NUM_BARS; i++)
        values[i] = 20 + rand() % (MAX_VALUE - 20);
    curr_size = 1;
    left_start = 0;
    paused = true;
    state = ST_IDLE;
}

void ResetMergeIndices(void) {
    int n = NUM_BARS;
    mid = left_start + curr_size - 1;
    right = (left_start + 2 * curr_size - 1 < n - 1)
                ? (left_start + 2 * curr_size - 1)
                : (n - 1);
    i_idx = left_start;
    j_idx = mid + 1;
    k_idx = left_start;
}

void NextMerge(void) {
    left_start += 2 * curr_size;
    if (left_start >= NUM_BARS - 1) {
        curr_size *= 2;
        left_start = 0;
        if (curr_size >= NUM_BARS) {
            state = ST_DONE;
            paused = true;
            return;
        }
    }
    ResetMergeIndices();
}

void DoMergeStep(void) {
    if (state != ST_SORTING || paused) return;

    for (int step = 0; step < speed; step++) {
        if (i_idx <= mid && j_idx <= right) {
            if (values[i_idx] <= values[j_idx])
                aux[k_idx++] = values[i_idx++];
            else
                aux[k_idx++] = values[j_idx++];
        } else if (i_idx <= mid) {
            aux[k_idx++] = values[i_idx++];
        } else if (j_idx <= right) {
            aux[k_idx++] = values[j_idx++];
        }

        // If merged this segment
        if (k_idx > right) {
            for (int t = left_start; t <= right; t++)
                values[t] = aux[t];
            NextMerge();
            break; // break this step loop to refresh drawing
        }
    }
}

void UpdateDrawFrame(void) {
    if (IsKeyPressed(KEY_SPACE)) {
        if (state == ST_IDLE) {
            state = ST_SORTING;
            paused = false;
            ResetMergeIndices();
        } else if (state == ST_DONE) {
            ResetArray();
        } else {
            paused = !paused;
        }
    }
    if (IsKeyPressed(KEY_R)) ResetArray();
    if (IsKeyPressed(KEY_RIGHT_BRACKET)) speed *= 2;
    if (IsKeyPressed(KEY_LEFT_BRACKET)) speed = (speed > 1) ? speed / 2 : 1;
    if (IsKeyPressed(KEY_ESCAPE)) {
        emscripten_cancel_main_loop();
        CloseWindow();
        return;
    }

    DoMergeStep();

    BeginDrawing();
    ClearBackground(BLACK);

    int sw = GetScreenWidth();
    int sh = GetScreenHeight();
    float barWidth = (float)sw / NUM_BARS;

    for (int i = 0; i < NUM_BARS; i++) {
        int h = values[i];
        int x = i * barWidth;
        int y = sh - h;
        Color c = RAYWHITE;

        if (state == ST_SORTING) {
            if (i >= left_start && i <= right) c = GREEN;
            if (i == i_idx || i == j_idx) c = ORANGE;
        }
        if (state == ST_DONE) c = SKYBLUE;

        DrawRectangle(x + 1, y, barWidth - 2, h, c);
    }

    DrawText("Merge Sort Visualization", 10, 10, 20, RAYWHITE);
    DrawText("SPACE: start/pause | R: reset | [ ] speed | Esc quit", 10, 40, 16, LIGHTGRAY);
    char buf[128];
    sprintf(buf, "State: %s  speed:%d  size:%d", 
            state == ST_DONE ? "done" : (paused ? "paused" : "running"), speed, curr_size);
    DrawText(buf, 10, 65, 16, LIGHTGRAY);

    EndDrawing();
}

int main(void) {
    SetConfigFlags(FLAG_WINDOW_RESIZABLE);
    InitWindow(1000, 700, "Merge Sort Visualization");
    SetTargetFPS(60);
    ResetArray();

    emscripten_set_main_loop(UpdateDrawFrame, 0, 1);

    CloseWindow();
    return 0;
}
