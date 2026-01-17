#!/bin/bash

# Ralph - Automated task runner for Cookie Isle development
# Runs opencode in a loop, each iteration completing one task from the PRD
# Uses Claude Opus 4.5 on Anthropic connection

ITERATIONS=10
PROMPT_FILE="ralphprompt.txt"
MODEL="anthropic/claude-sonnet-4-5"

echo "=========================================="
echo "  Ralph - Cookie Isle Task Runner"
echo "  Running $ITERATIONS iterations"
echo "  Model: $MODEL"
echo "=========================================="
echo ""

for i in $(seq 1 $ITERATIONS); do
    echo ""
    echo "=========================================="
    echo "  Iteration $i of $ITERATIONS"
    echo "  Started: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    echo ""
    
    # Read the prompt from file
    PROMPT=$(cat "$PROMPT_FILE")
    
    # Run opencode with the specified model using 'run' command
    # This runs non-interactively and exits when complete
    opencode run --model "$MODEL" "$PROMPT"
    
    EXIT_CODE=$?
    
    echo ""
    echo "------------------------------------------"
    echo "  Iteration $i completed (exit code: $EXIT_CODE)"
    echo "  Finished: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "------------------------------------------"
    
    # Optional: add a small delay between iterations
    if [ $i -lt $ITERATIONS ]; then
        echo "  Starting next iteration in 2 seconds..."
        sleep 2
    fi
done

echo ""
echo "=========================================="
echo "  Ralph completed all $ITERATIONS iterations"
echo "  Finished: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
