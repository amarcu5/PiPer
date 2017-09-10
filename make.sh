#!/bin/bash
#
# Make the PiPer Safari extension

EXTENSION_NAME="PiPer"

# Build tool paths; fallback to local build tools
CSSO_PATH="./build-tools/csso"
CCJS_PATH=$(type "google-closure-compiler-js" >/dev/null 2>&1 && echo "google-closure-compiler-js" || echo "./build-tools/google-closure-compiler-js")
XARJS_PATH=$(type "xarjs" >/dev/null 2>&1 && echo "xarjs" || echo "./build-tools/xarjs")
SVGO_PATH=$(type "svgo" >/dev/null 2>&1 && echo "svgo" || echo "./build-tools/svgo")
PLISTBUDDY_PATH=$(type "/usr/libexec/PlistBuddy" >/dev/null 2>&1 && echo "/usr/libexec/PlistBuddy" || echo "./build-tools/plistbuddy")

# Certifcate paths
LEAF_CERT_PATH="../certs/cert.pem"
INTERMEDIATE_CERT_PATH="../certs/apple-intermediate.pem"
ROOT_CERT_PATH="../certs/apple-root.pem"
PRIVATE_KEY_PATH="../certs/privatekey.pem"


# Display help then exit
show_help() {
  cat << EOF
Usage: make.sh [options]

Options:
  -h -? --help                  Show this screen
  -p --profile <release|debug>  Set settings according to profile [default: debug]
  -c --compress-css             Compress CSS
  -j --compress-js              Compress JavaScript
  -s --compress-svg             Compress SVG
  -e --package-extension        Package Safari extension (requires private key)
  -v --no-version-increment     Disable automatic version incrementing
EOF
  exit 0
}

arguments=("$@")

# First pass processing arguments
while :; do
  case $1 in
    -h|-\?|--help) show_help ;;
    -p|--profile) [[ "$2" ]] && profile=$2 ;;
    --profile=?*) profile=${1#*=} ;;
    -?*) ;;
    *) break
  esac
  shift
done

# Set default settings as per profile
case $profile in
  release)
    compress_svg=1
    compress_css=1
    compress_js=1
    package_ext=1
    ;;
  *)
    compress_svg=0
    compress_css=0
    compress_js=0
    package_ext=0
esac
update_version=1

set -- "${arguments[@]}"

# Second pass processing arguments
while :; do
  case $1 in
    -c|--compress-css) compress_css=1 ;;
    -j|--compress-js) compress_js=1 ;;
    -s|--compress-svg) compress_svg=1 ;;
    -e|--package-extension) package_ext=1 ;;
    -v|--no-version-increment) update_version=0 ;;
    -p|--profile) shift ;;
    -?*) ;;
    *) break
  esac
  shift
done


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
if [[ "$compress_svg" -eq 1 ]]; then
  ${SVGO_PATH} -q -f "out/${EXTENSION_NAME}.safariextension/images"
fi

# Compress all inline CSS with CSSO
if [[ "$compress_css" -eq 1 ]]; then
  function minify_css() { 
    echo "$@" | sed -e 's/\\"/"/g' -e 's/\\\$/$/g' | ${CSSO_PATH} --declaration-list
  }
  export -f minify_css
  export CSSO_PATH
  for path in "out/${EXTENSION_NAME}.safariextension/scripts"/*.js; do
    source=$(cat "${path}")
    echo "echo \"$(sed -e 's/\\/\\\\/g' -e 's/\$/\\$/g' -e 's/\`/\\`/g' -e 's/\"/\\\"/g' -e 's/\\n/\\\\n/g' <<< "$source" \
      | perl -0pe 's/\/\*\*\s+CSS\s+\*\/\s*\(\s*\\`(.*?)\\`\s*\)/\\`\$(minify_css '\''$1'\'')\\`/gms')\"" \
      | sh > "${path}"
  done
fi

# Use closure compiler to compress javascript
if [[ "$compress_js" -eq 1 ]]; then
  for path in "out/${EXTENSION_NAME}.safariextension/scripts"/*.js; do
    [[ $(basename $path) == "externs.js" ]] && continue
    path=${path%.*}
    ${CCJS_PATH} \
      --compilationLevel ADVANCED \
      --warningLevel VERBOSE \
      --newTypeInf \
      --useTypesForOptimization \
      --externs "out/${EXTENSION_NAME}.safariextension/scripts/externs.js" \
    "${path}.js" > "${path}.min.js"
      mv "${path}.min.js" "${path}.js"
  done
fi
rm "out/${EXTENSION_NAME}.safariextension/scripts/externs.js"

# Update version info from git
if [[ "$update_version" -eq 1 ]]; then
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
fi

# Package safari extension
cd out || exit
if [[ "$package_ext" -eq 1 ]] && [[ -f "${PRIVATE_KEY_PATH}" ]]; then
  [[ ${XARJS_PATH} != /* ]] && ! type "${XARJS_PATH}" >/dev/null 2>&1 && XARJS_PATH="../${XARJS_PATH}"
  ${XARJS_PATH} create "${EXTENSION_NAME}.safariextz" --cert "${LEAF_CERT_PATH}" --cert "${INTERMEDIATE_CERT_PATH}" --cert "${ROOT_CERT_PATH}" --private-key "${PRIVATE_KEY_PATH}" "${EXTENSION_NAME}.safariextension"
  rm -rf "${EXTENSION_NAME}.safariextension"
fi

echo "Done."
