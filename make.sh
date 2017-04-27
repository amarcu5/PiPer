#!/bin/bash

#
# Settings
#

EXTENSION_NAME="PiPer"

# Paths
CCJS_PATH="./build-tools/ccjs"                # "ccjs"
XARJS_PATH="./build-tools/xarjs"              # "xarjs"
SVGO_PATH="./build-tools/svgo"                # "svgo"
PLISTBUDDY_PATH="./build-tools/plistbuddy"    # "/usr/libexec/PlistBuddy"

# Certifcates
LEAF_CERT_PATH="../certs/cert.pem"
INTERMEDIATE_CERT_PATH="../certs/apple-intermediate.pem"
ROOT_CERT_PATH="../certs/apple-root.pem"
PRIVATE_KEY_PATH="../certs/privatekey.pem"


#
# Build script
#

# Set working directory to project root
project_root=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd "$project_root" || exit

# Remove output folder
rm -rf out

# Make output folder
mkdir -p "out/${EXTENSION_NAME}.safariextension"

# Copy items into output folder
cp -r src/* "out/${EXTENSION_NAME}.safariextension/"

# Compress all supported images with SVGO
${SVGO_PATH} -q -f "out/${EXTENSION_NAME}.safariextension/images"

# Use closure compiler to compress javascript
${CCJS_PATH} \
  --compilationLevel ADVANCED \
  --warningLevel VERBOSE \
  --newTypeInf \
  --useTypesForOptimization \
  --externs "out/${EXTENSION_NAME}.safariextension/scripts/externs.js" \
  out/${EXTENSION_NAME}.safariextension/scripts/main.js > out/${EXTENSION_NAME}.safariextension/scripts/main.min.js
mv out/${EXTENSION_NAME}.safariextension/scripts/main.min.js out/${EXTENSION_NAME}.safariextension/scripts/main.js
rm out/${EXTENSION_NAME}.safariextension/scripts/externs.js

# Update version info from git
git=$(sh /etc/profile; which git)
number_of_commits=$(($("$git" rev-list HEAD --count) + 1))
git_release_version=$("$git" describe --tags --always --abbrev=0)
git_release_version=${git_release_version%%-*};
git_release_version=${git_release_version#*v};
info_plist="out/${EXTENSION_NAME}.safariextension/Info.plist"
update_plist="update.plist"
${PLISTBUDDY_PATH} -c "Set :CFBundleVersion $number_of_commits" "$info_plist"
${PLISTBUDDY_PATH} -c "Set :CFBundleShortVersionString ${git_release_version}" "$info_plist"
${PLISTBUDDY_PATH} -c "Set \":Extension Updates:0:CFBundleVersion\" $number_of_commits" "$update_plist"
${PLISTBUDDY_PATH} -c "Set \":Extension Updates:0:CFBundleShortVersionString\" ${git_release_version#*v}" "$update_plist"

# Package safari extension
cd out  || exit
if [ -f "${PRIVATE_KEY_PATH}" ]
then
  [[ ${XARJS_PATH} != /* ]] && ! command -v "${XARJS_PATH}" >/dev/null 2>&1 && XARJS_PATH="../${XARJS_PATH}"
  ${XARJS_PATH} create "${EXTENSION_NAME}.safariextz" --cert "${LEAF_CERT_PATH}" --cert "${INTERMEDIATE_CERT_PATH}" --cert "${ROOT_CERT_PATH}" --private-key "${PRIVATE_KEY_PATH}" "${EXTENSION_NAME}.safariextension"
  rm -rf "${EXTENSION_NAME}.safariextension"
fi

echo "Done."
