#!/bin/bash

set -euo pipefail

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "Error: GEMINI_API_KEY environment variable is not set"
  exit 1
fi

# Create output directories and files
mkdir -p temp
mkdir -p book

# Read system prompt
if [ ! -f "SYSTEM_PROMPT.md" ]; then
  echo "Error: SYSTEM_PROMPT.md not found"
  exit 1
fi
SYSTEM_PROMPT=$(cat SYSTEM_PROMPT.md)

cd temp

curl -fsSL https://api.github.com/repos/rust-lang/book/contents/nostarch \
  | jq -r '.[] | select(.type=="file" and (.name | endswith(".md"))) | "\(.name) \(.sha) \(.download_url)"' \
  | tr -d '\r' \
  | while read -r name sha url; do
      # Check if already translated
      if grep -Fxq "$name $sha" ../github_shas.txt 2>/dev/null; then
        echo "Already translated: $name ($sha)"
        continue
      fi
      echo "Downloading: $name"
      curl -fsSLO "$url"

      # Prepare API request
      content=$(cat "$name")
      request_body=$(jq -n \
        --arg model "gemini-2.5-flash" \
        --arg system "$SYSTEM_PROMPT" \
        --arg user "$content" \
        '{
          model: $model,
          messages: [
            {role: "system", content: $system},
            {role: "user", content: $user}
          ]
        }')

      while true; do
        # Capture both response body and HTTP status code
        resp_with_code=$(curl -s -w "\n%{http_code}" "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $GEMINI_API_KEY" \
          -d "$request_body")

        # Separate body and status code
        http_code=$(echo "$resp_with_code" | tail -n1)
        response=$(echo "$resp_with_code" | sed '$d')

        # Validate status code
        if ! [[ "$http_code" =~ ^[0-9]+$ ]]; then
          echo "Invalid HTTP response code: $http_code. Retrying in 20 seconds..."
          sleep 20
          continue
        fi

        if [ "$http_code" -ne 200 ]; then
          echo "API request failed with status $http_code. Response body:"
          echo "$response"
          echo "Retrying in 20 seconds..."
          sleep 20
          continue
        fi

        # Extract and save the translation
        translation=$(echo "$response" | jq -r '.choices[0].message.content')
        output_file="../book/${name}"
        echo "$translation" > "$output_file"
        echo "Translated: $name"
        echo "$name $sha" >> github_shas.txt
        break
      done
    done

# Overwrite outer github_shas.txt with the updated one
mv -f github_shas.txt ../github_shas.txt

cd ..