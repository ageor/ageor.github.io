#!/usr/bin/env bash

echo "const data = [" > data.js
for f in *.json; do
    # filename=$(echo $f | cut -d "." -f1)
    echo "'$f'," >> data.js
done

echo "];" >> data.js
