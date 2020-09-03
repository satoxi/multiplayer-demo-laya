#!/bin/sh

cd ./src/utils/wechat
echo "compiling wechat mockup..."
tsc
cd ..
echo "compiling utils..."
tsc