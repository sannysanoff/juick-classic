CHROME_OUT=`pwd`/chrome_ext.zip
FF_OUT=`pwd`/juick_classic.xpi
OPERA_OUT=`pwd`/opera_addon.oex
rm $OPERA_OUT
rm $FF_OUT
rm $CHROME_OUT
VERSION=`grep "@version" web/content_post.js | awk '{print $3}'`
echo "VERSION=$VERSION"
sed -i "s/\"version\": \"\(.*\)\"/\"version\": \"$VERSION\"/g" web/manifest.json
sed -i "s/version = \"\(.*\)\"/version = \"$VERSION\"/g" config.xml


## CHROME

cd out/artifacts/extension_Web_exploded
sed -i "s/\"version\": \"\(.*\)\"/\"version\": \"$VERSION\"/g" manifest.json
jar cvf $CHROME_OUT *
cd -


## FIREFOX

sed -i "s/<em:version>\(.*\)<\/em:version>/<em:version>$VERSION<\/em:version>/g" install.rdf
cp overlay.xul chrome.manifest install.rdf /tmp
rm -rf /tmp/web
mkdir /tmp/web
cp web/content_post.js web/jquery*.js /tmp/web
cd /tmp
zip -r $FF_OUT overlay.xul chrome.manifest install.rdf web
cd -
rm -rf /tmp/web

## OPERA

mkdir -p /tmp/oex/includes
mkdir -p /tmp/oex/web
mkdir -p /tmp/oex/scripts
cp config.xml web/icon48.png index.html /tmp/oex
cp web/content_post.js /tmp/oex/includes/script.js
cp web/icon48.png web/popup.html web/jquery.min.js  /tmp/oex/web
cp scripts/opera_background.js /tmp/oex/scripts/
cd /tmp/oex
zip -r $OPERA_OUT config.xml index.html web includes scripts
cd -
rm -rf /tmp/oex
