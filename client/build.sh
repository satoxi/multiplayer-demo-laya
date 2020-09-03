#!/bin/sh
export NODE_OPTIONS=--max_old_space_size=4096

BASEDIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

DIST_DIR=$BASEDIR/release/dist

cd ./src/utils
echo "compiling utils scripts..."
tsc
cd ../../

echo "compiling game scripts..."
tsc


rm -rf $DIST_DIR
mkdir -p $DIST_DIR

echo "webpacking scripts..."
npx webpack

mkdir -p $DIST_DIR/res
mkdir -p $DIST_DIR/res/atlas

rsync -rv $BASEDIR/bin/ui $DIST_DIR
rsync -rv $BASEDIR/bin/ui-loc $DIST_DIR
rsync -rv $BASEDIR/bin/dom $DIST_DIR
rsync -rv $BASEDIR/bin/base64 $DIST_DIR

copyAtlas()
{
    FILENAME=$1
    DESTDIR=$2
    cp $BASEDIR/bin/res/atlas/$FILENAME.png $DESTDIR/res/atlas
    cp $BASEDIR/bin/res/atlas/$FILENAME.atlas $DESTDIR/res/atlas
}

cp $BASEDIR/bin/*.json $DIST_DIR 
cp $BASEDIR/bin/*.js $DIST_DIR
cp $BASEDIR/bin/*.png $DIST_DIR



