#include "raylib.h"
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <math.h>
#include <stdio.h>

// Game constants (proportional to screen size)
#define PADDLE_WIDTH_RATIO 0.15f  // Paddle width as % of screen width
#define PADDLE_HEIGHT_RATIO 0.015f  // Paddle height as % of screen height
#define BALL_SIZE_RATIO 0.012f  // Ball size as % of screen height
#define PADDLE_SPEED 700.0f
#define AI_PADDLE_SPEED 750.0f
#define BALL_SPEED 600.0f
#define PADDLE_MARGIN_RATIO 0.04f  // Margin as % of screen height
#define AI_REACTION_DELAY 0.05f
#define AI_PREDICTION_ERROR 0.15f

// Dynamic game dimensions
int PADDLE_WIDTH;
int PADDLE_HEIGHT;
int BALL_SIZE;
int PADDLE_MARGIN;

// Game state
typedef struct {
    Vector2 topPaddle;
    Vector2 bottomPaddle;
    Vector2 ball;
    Vector2 ballVelocity;
    int topScore;
    int bottomScore;
    bool gameStarted;
} GameState;

GameState game;

void UpdateDrawFrame(void);
void ResetBall(void);
void UpdateGame(void);
void UpdateAIPaddle(void);
void DrawGame(void);
EM_BOOL onCanvasResize(int eventType, const EmscriptenUiEvent *uiEvent, void *userData);

//------------------------------------------------------------------------------------
// Program main entry point
//------------------------------------------------------------------------------------
int main(void)
{
    // Initialization
    //--------------------------------------------------------------------------------------
    // Make it resizable *and* start borderless
    SetConfigFlags(FLAG_WINDOW_RESIZABLE | FLAG_WINDOW_UNDECORATED);

    // Get initial canvas size from browser
    double cssWidth, cssHeight;
    emscripten_get_element_css_size("#canvas", &cssWidth, &cssHeight);
    
    // Initialize window with browser dimensions
    InitWindow((int)cssWidth, (int)cssHeight, "Top-Down Pong");
    SetTargetFPS(60);
    
    // Set canvas size to match
    emscripten_set_canvas_element_size("#canvas", (int)cssWidth, (int)cssHeight);
    
    // Register resize callback
    emscripten_set_resize_callback(EMSCRIPTEN_EVENT_TARGET_WINDOW, NULL, EM_FALSE, onCanvasResize);
    
    // Get actual screen dimensions after initialization
    int screenWidth = GetScreenWidth();
    int screenHeight = GetScreenHeight();
    
    // Calculate responsive dimensions
    PADDLE_WIDTH = (int)(screenWidth * PADDLE_WIDTH_RATIO);
    PADDLE_HEIGHT = (int)(screenHeight * PADDLE_HEIGHT_RATIO);
    BALL_SIZE = (int)(screenHeight * BALL_SIZE_RATIO);
    PADDLE_MARGIN = (int)(screenHeight * PADDLE_MARGIN_RATIO);
    
    // Ensure minimum sizes
    if (PADDLE_WIDTH < 50) PADDLE_WIDTH = 50;
    if (PADDLE_HEIGHT < 10) PADDLE_HEIGHT = 10;
    if (BALL_SIZE < 8) BALL_SIZE = 8;
    if (PADDLE_MARGIN < 20) PADDLE_MARGIN = 20;

    // Initialize game state (will be set properly in UpdateGame on first frame)
    game.topPaddle = (Vector2){0, PADDLE_MARGIN};
    game.bottomPaddle = (Vector2){0, screenHeight - PADDLE_MARGIN - PADDLE_HEIGHT};
    game.topScore = 0;
    game.bottomScore = 0;
    game.gameStarted = false;
    ResetBall();

    emscripten_set_main_loop(UpdateDrawFrame, 0, 1);

    // --------------------------------------------------------------------------------------
    CloseWindow();        
    // --------------------------------------------------------------------------------------

    return 0;
}

void ResetBall(void) {
    int screenWidth = GetScreenWidth();
    int screenHeight = GetScreenHeight();
    
    game.ball = (Vector2){screenWidth / 2.0f, screenHeight / 2.0f};
    
    // Random direction for ball (primarily vertical)
    float angle = (float)(GetRandomValue(0, 360)) * DEG2RAD;
    game.ballVelocity = (Vector2){cosf(angle) * BALL_SPEED, sinf(angle) * BALL_SPEED};
    
    // Ensure ball doesn't go too horizontal
    if (fabsf(game.ballVelocity.y) < BALL_SPEED * 0.3f) {
        game.ballVelocity.y = (game.ballVelocity.y > 0 ? 1 : -1) * BALL_SPEED * 0.7f;
        game.ballVelocity.x = (game.ballVelocity.x > 0 ? 1 : -1) * BALL_SPEED * 0.7f;
    }
    
    game.gameStarted = false;
}

void UpdateGame(void) {
    int screenWidth = GetScreenWidth();
    int screenHeight = GetScreenHeight();
    float deltaTime = GetFrameTime();
    
    // Recalculate responsive dimensions (in case window was resized)
    static int lastScreenWidth = 0;
    static int lastScreenHeight = 0;
    
    if (lastScreenWidth != screenWidth || lastScreenHeight != screenHeight) {
        PADDLE_WIDTH = (int)(screenWidth * PADDLE_WIDTH_RATIO);
        PADDLE_HEIGHT = (int)(screenHeight * PADDLE_HEIGHT_RATIO);
        BALL_SIZE = (int)(screenHeight * BALL_SIZE_RATIO);
        PADDLE_MARGIN = (int)(screenHeight * PADDLE_MARGIN_RATIO);
        
        // Ensure minimum sizes
        if (PADDLE_WIDTH < 50) PADDLE_WIDTH = 50;
        if (PADDLE_HEIGHT < 10) PADDLE_HEIGHT = 10;
        if (BALL_SIZE < 8) BALL_SIZE = 8;
        if (PADDLE_MARGIN < 20) PADDLE_MARGIN = 20;
        
        lastScreenWidth = screenWidth;
        lastScreenHeight = screenHeight;
    }

    // Initialize paddle positions on first frame (in case screen size changed)
    static bool paddlesInitialized = false;
    if (!paddlesInitialized) {
        game.topPaddle = (Vector2){screenWidth / 2.0f - PADDLE_WIDTH / 2.0f, PADDLE_MARGIN};
        game.bottomPaddle = (Vector2){screenWidth / 2.0f - PADDLE_WIDTH / 2.0f, screenHeight - PADDLE_MARGIN - PADDLE_HEIGHT};
        paddlesInitialized = true;
    }

    // Start game on spacebar, mouse click, or touch tap
    if (IsKeyPressed(KEY_SPACE) || IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
        game.gameStarted = true;
    }
    
    // Also start on touch tap
    if (GetTouchPointCount() > 0 && !game.gameStarted) {
        game.gameStarted = true;
    }

    // Update AI-controlled top paddle
    if (game.gameStarted) {
        UpdateAIPaddle();
    }

    // Update bottom paddle (Left/Right arrow keys)
    if (IsKeyDown(KEY_LEFT) && game.bottomPaddle.x > 0) {
        game.bottomPaddle.x -= PADDLE_SPEED * deltaTime;
    }
    if (IsKeyDown(KEY_RIGHT) && game.bottomPaddle.x + PADDLE_WIDTH < screenWidth) {
        game.bottomPaddle.x += PADDLE_SPEED * deltaTime;
    }
    
    // Touch and mouse control for bottom paddle
    // Check for touch input first (mobile priority)
    int touchCount = GetTouchPointCount();
    if (touchCount > 0) {
        // Use first touch point
        Vector2 touchPos = GetTouchPosition(0);
        // Allow control anywhere on screen for mobile
        float targetX = touchPos.x - PADDLE_WIDTH / 2.0f;
        targetX = fmaxf(0, fminf(targetX, screenWidth - PADDLE_WIDTH));
        game.bottomPaddle.x = targetX;
    } else {
        // Desktop mouse control - only in bottom half or when dragging
        Vector2 mousePos = GetMousePosition();
        if (mousePos.y >= screenHeight / 2 || IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
            float targetX = mousePos.x - PADDLE_WIDTH / 2.0f;
            targetX = fmaxf(0, fminf(targetX, screenWidth - PADDLE_WIDTH));
            game.bottomPaddle.x = targetX;
        }
    }

    // Update ball if game has started
    if (game.gameStarted) {
        game.ball.x += game.ballVelocity.x * deltaTime;
        game.ball.y += game.ballVelocity.y * deltaTime;

        // Ball collision with left and right walls
        if (game.ball.x <= BALL_SIZE / 2.0f || game.ball.x >= screenWidth - BALL_SIZE / 2.0f) {
            game.ballVelocity.x = -game.ballVelocity.x;
            game.ball.x = fmaxf(BALL_SIZE / 2.0f, fminf(game.ball.x, screenWidth - BALL_SIZE / 2.0f));
        }

        // Ball collision with top paddle
        if (game.ball.y - BALL_SIZE / 2.0f <= game.topPaddle.y + PADDLE_HEIGHT &&
            game.ball.y - BALL_SIZE / 2.0f >= game.topPaddle.y &&
            game.ball.x + BALL_SIZE / 2.0f >= game.topPaddle.x &&
            game.ball.x - BALL_SIZE / 2.0f <= game.topPaddle.x + PADDLE_WIDTH &&
            game.ballVelocity.y < 0) {
            
            game.ballVelocity.y = -game.ballVelocity.y;
            
            // Add spin based on where ball hits paddle
            float hitPos = (game.ball.x - game.topPaddle.x) / PADDLE_WIDTH; // 0 to 1
            float spin = (hitPos - 0.5f) * 2.0f; // -1 to 1
            game.ballVelocity.x += spin * 100.0f;
            
            game.ball.y = game.topPaddle.y + PADDLE_HEIGHT + BALL_SIZE / 2.0f;
        }

        // Ball collision with bottom paddle
        if (game.ball.y + BALL_SIZE / 2.0f >= game.bottomPaddle.y &&
            game.ball.y + BALL_SIZE / 2.0f <= game.bottomPaddle.y + PADDLE_HEIGHT &&
            game.ball.x + BALL_SIZE / 2.0f >= game.bottomPaddle.x &&
            game.ball.x - BALL_SIZE / 2.0f <= game.bottomPaddle.x + PADDLE_WIDTH &&
            game.ballVelocity.y > 0) {
            
            game.ballVelocity.y = -game.ballVelocity.y;
            
            // Add spin based on where ball hits paddle
            float hitPos = (game.ball.x - game.bottomPaddle.x) / PADDLE_WIDTH; // 0 to 1
            float spin = (hitPos - 0.5f) * 2.0f; // -1 to 1
            game.ballVelocity.x += spin * 100.0f;
            
            game.ball.y = game.bottomPaddle.y - BALL_SIZE / 2.0f;
        }

        // Limit ball velocity
        float speed = sqrtf(game.ballVelocity.x * game.ballVelocity.x + game.ballVelocity.y * game.ballVelocity.y);
        if (speed > BALL_SPEED * 1.5f) {
            game.ballVelocity.x = (game.ballVelocity.x / speed) * BALL_SPEED * 1.5f;
            game.ballVelocity.y = (game.ballVelocity.y / speed) * BALL_SPEED * 1.5f;
        }

        // Score points
        if (game.ball.y < 0) {
            game.bottomScore++;
            ResetBall();
        }
        if (game.ball.y > screenHeight) {
            game.topScore++;
            ResetBall();
        }
    } else {
        // Keep ball centered when game hasn't started
        game.ball = (Vector2){screenWidth / 2.0f, screenHeight / 2.0f};
    }

    // Keep paddles in bounds
    if (game.topPaddle.x < 0) game.topPaddle.x = 0;
    if (game.topPaddle.x + PADDLE_WIDTH > screenWidth) game.topPaddle.x = screenWidth - PADDLE_WIDTH;
    if (game.topPaddle.y < 0) game.topPaddle.y = 0;
    
    if (game.bottomPaddle.x < 0) game.bottomPaddle.x = 0;
    if (game.bottomPaddle.x + PADDLE_WIDTH > screenWidth) game.bottomPaddle.x = screenWidth - PADDLE_WIDTH;
    // Ensure bottom paddle stays at bottom (always update Y position based on screen height)
    game.bottomPaddle.y = screenHeight - PADDLE_MARGIN - PADDLE_HEIGHT;
}

void UpdateAIPaddle(void) {
    int screenWidth = GetScreenWidth();
    int screenHeight = GetScreenHeight();
    float deltaTime = GetFrameTime();
    
    // Only react if ball is moving towards the top paddle (negative Y velocity)
    if (game.ballVelocity.y >= 0) {
        // Ball is moving away, AI can relax or move to center
        float centerX = screenWidth / 2.0f - PADDLE_WIDTH / 2.0f;
        float diff = centerX - game.topPaddle.x;
        if (fabsf(diff) > 5.0f) {
            float moveSpeed = AI_PADDLE_SPEED * 0.7f * deltaTime; // Faster return to center
            if (diff > 0) {
                game.topPaddle.x += fminf(moveSpeed, diff);
            } else {
                game.topPaddle.x -= fminf(moveSpeed, -diff);
            }
        }
        return;
    }
    
    // Calculate where ball will be when it reaches the top paddle
    // React immediately even if ball is far away
    float paddleY = game.topPaddle.y + PADDLE_HEIGHT / 2.0f;
    float distanceToPaddle = paddleY - game.ball.y;
    
    // Always predict and move if ball is coming towards us
    if (game.ballVelocity.y < 0) {
        // Use absolute distance (ball might be below paddle initially)
        float timeToReach = fabsf(distanceToPaddle) / fabsf(game.ballVelocity.y);
        
        // Predict ball's X position when it reaches the paddle
        // Account for wall bounces
        float predictedX = game.ball.x;
        float remainingTime = timeToReach;
        float ballX = game.ball.x;
        float ballVelX = game.ballVelocity.x;
        
        // Simulate ball movement with wall bounces
        while (remainingTime > 0.001f) {
            float timeToWall = 0;
            if (ballVelX > 0) {
                timeToWall = (screenWidth - BALL_SIZE / 2.0f - ballX) / ballVelX;
            } else if (ballVelX < 0) {
                timeToWall = (ballX - BALL_SIZE / 2.0f) / (-ballVelX);
            } else {
                timeToWall = remainingTime + 1.0f; // No horizontal movement
            }
            
            if (timeToWall > remainingTime || timeToWall <= 0) {
                // Ball reaches paddle before hitting wall
                predictedX = ballX + ballVelX * remainingTime;
                break;
            } else {
                // Ball hits wall, bounce and continue
                ballX += ballVelX * timeToWall;
                ballVelX = -ballVelX;
                remainingTime -= timeToWall;
            }
        }
        
        // Add prediction error to make AI beatable
        float errorRange = screenWidth * AI_PREDICTION_ERROR;
        float error = ((float)GetRandomValue(-100, 100) / 100.0f) * errorRange;
        predictedX += error;
        
        // Target is center of paddle aligned with predicted ball position
        float targetX = predictedX - PADDLE_WIDTH / 2.0f;
        targetX = fmaxf(0, fminf(targetX, screenWidth - PADDLE_WIDTH));
        
        // Move towards target immediately with full speed
        float diff = targetX - game.topPaddle.x;
        float maxMove = AI_PADDLE_SPEED * deltaTime;
        
        // Reduced dead zone for faster reaction
        if (fabsf(diff) > 1.0f) {
            if (diff > 0) {
                game.topPaddle.x += fminf(maxMove, diff);
            } else {
                game.topPaddle.x -= fminf(maxMove, -diff);
            }
        }
    }
}

void DrawGame(void) {
    int screenWidth = GetScreenWidth();
    int screenHeight = GetScreenHeight();
    
    // Calculate responsive font sizes (based on screen height)
    int scoreFontSize = (int)(screenHeight * 0.08f);  // 8% of screen height
    int startFontSize = (int)(screenHeight * 0.04f);  // 4% of screen height
    int hintFontSize = (int)(screenHeight * 0.025f);  // 2.5% of screen height
    
    // Ensure minimum font sizes
    if (scoreFontSize < 20) scoreFontSize = 20;
    if (startFontSize < 16) startFontSize = 16;
    if (hintFontSize < 12) hintFontSize = 12;

    // Draw center line (horizontal) - responsive spacing
    int lineSpacing = (int)(screenWidth * 0.02f);
    if (lineSpacing < 10) lineSpacing = 10;
    for (int i = 0; i < screenWidth; i += lineSpacing * 2) {
        int lineWidth = (int)(screenWidth * 0.01f);
        int lineHeight = (int)(screenHeight * 0.005f);
        if (lineWidth < 5) lineWidth = 5;
        if (lineHeight < 2) lineHeight = 2;
        DrawRectangle(i, screenHeight / 2 - lineHeight / 2, lineWidth, lineHeight, (Color){255, 255, 255, 100});
    }

    // Draw paddles
    DrawRectangleRec((Rectangle){game.topPaddle.x, game.topPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT}, RAYWHITE);
    DrawRectangleRec((Rectangle){game.bottomPaddle.x, game.bottomPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT}, RAYWHITE);

    // Draw ball
    DrawCircleV(game.ball, BALL_SIZE / 2.0f, RAYWHITE);

    // Draw scores
    char topScoreText[10];
    char bottomScoreText[10];
    sprintf(topScoreText, "%d", game.topScore);
    sprintf(bottomScoreText, "%d", game.bottomScore);
    
    int topScoreWidth = MeasureText(topScoreText, scoreFontSize);
    int bottomScoreWidth = MeasureText(bottomScoreText, scoreFontSize);
    
    int scoreMargin = (int)(screenHeight * 0.05f);
    DrawText(topScoreText, screenWidth / 2 - topScoreWidth / 2, scoreMargin, scoreFontSize, RAYWHITE);
    DrawText(bottomScoreText, screenWidth / 2 - bottomScoreWidth / 2, screenHeight - scoreMargin - scoreFontSize, scoreFontSize, RAYWHITE);

    // Draw start message
    if (!game.gameStarted) {
        const char* startText = "TAP or PRESS SPACE";
        const char* startText2 = "to start";
        int textWidth = MeasureText(startText, startFontSize);
        int textWidth2 = MeasureText(startText2, startFontSize);
        DrawText(startText, screenWidth / 2 - textWidth / 2, screenHeight / 2 + startFontSize, startFontSize, YELLOW);
        DrawText(startText2, screenWidth / 2 - textWidth2 / 2, screenHeight / 2 + startFontSize * 2.5f, startFontSize, YELLOW);
    }

    // Draw controls hint
    const char* controlsText = "Top: AI | Bottom: Touch/Mouse/Arrows";
    int controlsWidth = MeasureText(controlsText, hintFontSize);
    DrawText(controlsText, screenWidth / 2 - controlsWidth / 2, screenHeight / 2 - startFontSize, hintFontSize, (Color){200, 200, 200, 255});
}

// Function to handle canvas resize
EM_BOOL onCanvasResize(int eventType, const EmscriptenUiEvent *uiEvent, void *userData) {
    double width, height;
    emscripten_get_element_css_size("#canvas", &width, &height);
    emscripten_set_canvas_element_size("#canvas", (int)width, (int)height);
    return EM_TRUE;
}

void UpdateDrawFrame(void) {
    // Check and update canvas size if window was resized
    int currentWidth = GetScreenWidth();
    int currentHeight = GetScreenHeight();
    
    double cssWidth, cssHeight;
    emscripten_get_element_css_size("#canvas", &cssWidth, &cssHeight);
    
    if ((int)cssWidth != currentWidth || (int)cssHeight != currentHeight) {
        emscripten_set_canvas_element_size("#canvas", (int)cssWidth, (int)cssHeight);
    }
    
    UpdateGame();
    
    BeginDrawing();
        ClearBackground(BLACK);
        DrawGame();
    EndDrawing();
}
