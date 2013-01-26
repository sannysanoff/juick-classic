CHROME_OUT=`pwd`/chrome_ext.zip
FF_OUT=`pwd`/juick_classic.xpi
OPERA_OUT=`pwd`/opera_addon.oex
VERSION=`grep "@version" web/content_post.js | awk '{print $3}'`
echo "VERSION=$VERSION"
sed -i "s/\"version\": \"\(.*\)\"/\"version\": \"$VERSION\"/g" web/manifest.json
cd out/artifacts/extension_Web_exploded
sed -i "s/\"version\": \"\(.*\)\"/\"version\": \"$VERSION\"/g" manifest.json
jar cvf $CHROME_OUT *
cd -
sed -i "s/<em:version>\(.*\)<\/em:version>/<em:version>$VERSION<\/em:version>/g" install.rdf
cp overlay.xul chrome.manifest install.rdf /tmp
rm -rf /tmp/web
mkdir /tmp/web
cp web/content_post.js /tmp/web
cd /tmp
zip -r $FF_OUT overlay.xul chrome.manifest install.rdf web
cd -
rm -rf /tmp/web
mkdir -p /tmp/oex/includes
mkdir -p /tmp/oex/web
cp config.xml web/icon48.png index.html /tmp/oex
cp web/content_post.js /tmp/oex/includes/script.js
cp web/icon48.png /tmp/oex/web
cd /tmp/oex
zip -r $OPERA_OUT config.xml index.html web includes
cd -
rm -rf /tmp/oex
