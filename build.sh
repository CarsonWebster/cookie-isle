#!/bin/bash
# Cloudflare Pages build script
# Detects branch and runs appropriate build

echo "Building for branch: $CF_PAGES_BRANCH"

if [ "$CF_PAGES_BRANCH" = "main" ]; then
    echo "Running Hugo build for production..."
    hugo
    # Output is in 'public/' directory
else
    echo "Running SvelteKit build for preview..."
    bun install
    bun run build
    # Move SvelteKit output to 'public/' so Cloudflare finds it
    rm -rf public
    mv .svelte-kit/cloudflare public
fi

echo "Build complete!"
