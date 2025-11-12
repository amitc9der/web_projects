// merge_sort_vis.c
#include "raylib.h"
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <emscripten/emscripten.h>

#define NUM_BARS 60       // increase/decrease number of bars
#define MAX_VALUE 600
#define MIN_BAR_WIDTH 2

// Sorting states
typedef enum {
    ST_IDLE,
    ST_RUNNING,
    ST_MERGING,
    ST_DONE
} SortState;

static int values[NUM_BARS];
static int aux[NUM_BARS];
static SortState state = ST_IDLE;

// Merge step indices
static int left = 0, mid = 0, right = 0;
static int i_idx = 0, j_idx = 0, k_idx = 0;
static int speed = 1; // number of "merge inner steps" per frame (higher = faster)
static bool paused = true;

// For iterative merge scheduling
static int curr_size = 1;  // current size of subarrays to merge
static int left_start = 0;

// Window variables
static int screenWidth = 1000;
static int screenHeight = 700;

// Colors
static Color barColor = RAYWHITE;
static Color compareColor = ORANGE;
static Color mergeColor = GREEN;
static Color doneColor = SKYBLUE;

// Forward
void ResetArray(void);
void StartSorting(void);
void ResetSortingState(void);
void DoMergeStep(void);
void UpdateDrawFrame(void);

void ResetArray(void) {
    srand((unsigned)time(NULL));
    for (int i = 0; i < NUM_BARS; i++) values[i] = 20 + rand() % (MAX_VALUE - 20);
    state = ST_IDLE;
    paused = true;
    curr_size = 1;
    left_start = 0;
}

void ResetSortingState(void) {
    // Reset merge indices for new merging run
    left = left_start;
    mid = left + curr_size - 1;
    right = (left + 2*curr_size - 1 < NUM_BARS - 1) ? (left + 2*curr_size - 1) : (NUM_BARS - 1);
    i_idx = left;
    j_idx = mid + 1;
    k_idx = left;
}

void StartSorting(void) {
    if (state == ST_DONE) {
        // Already finished
        return;
    }
    state = ST_RUNNING;
    paused = false;
    curr_size = 1;
    left_start = 0;
    ResetSortingState();
}

void DoMergeStep(void) {
    if (state != ST_RUNNING && state != ST_MERGING) return;

    // perform up to 'speed' elementary moves
    for (int step = 0; step < speed; step++) {
        if (left >= NUM_BARS) {
            // completed one full pass with this curr_size
            curr_size *= 2;
            if (curr_size >= NUM_BARS) {
                // finished sorting
                state = ST_DONE;
                paused = true;
                return;
            }
            // start new pass
            left_start = 0;
            ResetSortingState();
            continue;
        }
        // If mid already beyond array, just advance left
        if (mid >= NUM_BARS - 1) {
            left = left + 2*curr_size;
            ResetSortingState();
            continue;
        }

        // merge step: compare i_idx and j_idx
        if (i_idx <= mid && j_idx <= right) {
            if (values[i_idx] <= values[j_idx]) {
                aux[k_idx++] = values[i_idx++];
            } else {
                aux[k_idx++] = values[j_idx++];
            }
        } else if (i_idx <= mid) {
            aux[k_idx++] = values[i_idx++];
        } else if (j_idx <= right) {
            aux[k_idx++] = values[j_idx++];
        }

        // If this merge completed (k_idx > right) copy back
        if (k_idx > right) {
            // copy back merged segment from aux to values
            for (int t = left; t <= right; t++) {
                values[t] = aux[t];
            }
            // advance to next pair
            left = left + 2*curr_size;
            ResetSortingState();
        }

        // Break early if we paused during steps
        if (paused) return;
    }
}

void UpdateDrawFrame(void) {
    // Input handling
    if (IsKeyPressed(KEY_SPACE)) {
        if (state == ST_IDLE || state == ST_DONE) {
            ResetArray();
            StartSorting();
        } else {
            paused = !paused;
        }
    }
    if (IsKeyPressed(KEY_R)) {
        ResetArray();
    }
    if (IsKeyPressed(KEY_RIGHT_BRACKET)) { // ']'
        if (speed < 100) speed *= 2;
    }
    if (IsKeyPressed(KEY_LEFT_BRACKET)) { // '['
        if (speed > 1) speed = (speed / 2) > 0 ? speed / 2 : 1;
    }
    if (IsKeyPressed(KEY_ESCAPE)) {
        // Quit cleanly
        emscripten_cancel_main_loop();
        CloseWindow();
        return;
    }

    if (!paused && state != ST_DONE) {
        state = ST_RUNNING;
        DoMergeStep();
    }

    // Drawing
    BeginDrawing();
    ClearBackground(BLACK);

    // Calculate bar width and spacing
    const int sw = GetScreenWidth();
    const int sh = GetScreenHeight();
    const float barWidthF = (float)sw / (float)NUM_BARS;
    const int barWidth = (int)barWidthF > MIN_BAR_WIDTH ? (int)barWidthF : MIN_BAR_WIDTH;

    // Draw bars
    for (int idx = 0; idx < NUM_BARS; idx++) {
        int x = (int)(idx * barWidthF);
        int h = values[idx];
        int y = sh - h;

        Color col = barColor;

        // Highlight merging region
        if (state == ST_RUNNING || state == ST_MERGING) {
            if (idx >= left && idx <= right) col = mergeColor;
        }
        if (!paused) {
            // highlight active comparisons if in-range
            if (idx == i_idx || idx == j_idx) col = compareColor;
        }
        if (state == ST_DONE) col = doneColor;

        DrawRectangle(x + 1, y, barWidth - 2, h, col);
    }

    // HUD
    int hudY = 10;
    DrawText("Merge Sort Visualization", 12, hudY, 20, RAYWHITE);
    hudY += 28;
    DrawText("Space: start/pause | R: reset | [ or ]: speed down/up | Esc: quit", 12, hudY, 16, LIGHTGRAY);
    hudY += 22;

    char buf[128];
    sprintf(buf, "State: %s   Speed: %d   Num bars: %d   curr_size: %d",
            (state == ST_IDLE ? "idle" : (state == ST_RUNNING ? "running" : (state == ST_DONE ? "done" : "merging"))),
            speed, NUM_BARS, curr_size);
    DrawText(buf, 12, hudY, 14, LIGHTGRAY);

    EndDrawing();
}

// Main
int main(void)
{
    // Init window
    SetConfigFlags(FLAG_WINDOW_RESIZABLE);
    screenWidth = 1000;
    screenHeight = 700;
    InitWindow(screenWidth, screenHeight, "Merge Sort Visualization");

    SetTargetFPS(60);

    ResetArray();

    // Emscripten / non-emscripten friendly main loop:
    emscripten_set_main_loop(UpdateDrawFrame, 0, 1);

    CloseWindow();
    return 0;
}
