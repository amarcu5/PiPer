#!/bin/bash
#
# Make the PiPer Safari extension

EXTENSION_NAME="PiPer"

SOURCE_FILES=("main.js" "fix.js")

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
  -h -? --help                                  Show this screen
  -t --target (all|safari-legacy)               Make extension for target browser [default: all]
  -p --profile (release|debug|distribute)       Set settings according to profile [default: debug]
  -c --compress-css                             Compress CSS
  -j --compress-js                              Compress JavaScript
  -s --compress-svg                             Compress SVG
  -l --logging-level <number>                   Set logging level (0=all 10=trace 20=info 30=warning 40=error)
  -e --package-extension                        Package extension for distribution (safari-legacy requires private key)
  -d --no-debug-js                              Remove JavaScript source maps to prevent debugging
  -v --no-version-increment                     Disable automatic version incrementing

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
    -l|-t|--logging-level|--target) shift ;;
    -?*) ;;
    *) break
  esac
  shift
done

# Set default settings as per profile
case $profile in
  distribute)
    compress_svg=1
    compress_css=1
    compress_js=1
    debug_js=0
    package_ext=1
    logging_level=100
    ;;
  release)
    compress_svg=1
    compress_css=1
    compress_js=1
    debug_js=1
    package_ext=0
    logging_level=40
    ;;
  *)
    compress_svg=0
    compress_css=0
    compress_js=0
    debug_js=1
    package_ext=0
    logging_level=0
    profile="debug"
    ;;
esac
update_version=1
targets="all"

set -- "${arguments[@]}"

# Second pass processing arguments
while :; do
  case $1 in
    -c|--compress-css) compress_css=1 ;;
    -j|--compress-js) compress_js=1 ;;
    -s|--compress-svg) compress_svg=1 ;;
    -e|--package-extension) package_ext=1 ;;
    -d|--no-debug-js) debug_js=0 ;;
    -v|--no-version-increment) update_version=0 ;;
    -t|--target) [[ "$2" ]] && targets=$2 && shift ;;
    --target=?*) targets=${1#*=} ;;
    -l|--logging-level) [[ "$2" ]] && logging_level=$2 && shift ;;
    --logging-level=?*) logging_level=${1#*=} ;;
    -p|--profile) shift ;;
    -?*) ;;
    *) break ;;
  esac
  shift
done

# Highlight selected build profile 
echo "Setting '${profile}' profile"

# Validate targets
case $targets in
  safari-legacy) targets=("safari-legacy") ;;
  *) targets=("safari-legacy")
esac

# Helper checks for build tool dependency and falls back to 'npx' if possible
function get_node_command() {
  if type "$1" &>/dev/null; then
    echo "$1"
  elif type "npx" &>/dev/null; then
    npx_package=$([[ -z "$2" ]] && echo "$1" || echo "$2")
    echo "npx --quiet --package ${npx_package} $1"
    echo "Info: '$1' command not found therefore falling back to 'npx'; performance may suffer (avoid this by installing package with 'npm install ${npx_package} -g')" >&2
  else
    echo "Error: '$1' command not found and neither fallback 'npx'" >&2
    echo "Please install the latest version of Node.js (see https://nodejs.org/en/download/package-manager/)" >&2
    return 1
  fi
  return 0
}

# Target specific build checks
for i in "${!targets[@]}"; do
  
  if [[ "${targets[$i]}" = "safari-legacy" ]]; then
    
    # Get 'safari-legacy' specific build tool path and exit if not found
    [[ "${package_ext}" -eq 1 ]] && { XARJS_PATH=$(get_node_command "xarjs" "xar-js") || exit 1; }
  fi
  
done

# Check for google closure compiler requirements and exit if not found
CCJS_PATH=$(get_node_command "google-closure-compiler") || exit 1;
if ${CCJS_PATH} --platform native --version &>/dev/null; then
  CCJS_PATH="${CCJS_PATH} --platform native";
elif ${CCJS_PATH} --platform java --version &>/dev/null; then
  CCJS_PATH="${CCJS_PATH} --platform java";
else
  echo "Error: Java runtime required by 'google-closure-compiler' not found" >&2
  echo "Please install the latest version of Java (see https://www.java.com/en/download/)" >&2
  exit 1
fi

# Check for csso and exit if not found 
[[ "${compress_css}" -eq 1 ]] && { CSSO_PATH=$(get_node_command "csso" "csso-cli") || exit 1; }

# Check for svgo and exit if not found 
[[ "${compress_svg}" -eq 1 ]] && { SVGO_PATH=$(get_node_command "svgo") || exit 1; }

# Check for git and exit if not found
if [[ "${update_version}" -eq 1 ]] && { ! type "git" &>/dev/null; }; then
  echo "Error: 'git' command not found" >&2
  echo "Please install the latest version of git (see https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)" >&2
  exit 1
else
  GIT_PATH=$(sh /etc/profile; which git)
fi


#
# Build script
#

# Set working directory to project root
cd "${BASH_SOURCE[0]%/*}"

# Remove output folder
rm -rf out

# Make common output folder
mkdir -p "out/${EXTENSION_NAME}"

# Copy common items into common output folder
cp -r "src/common"/* "out/${EXTENSION_NAME}/"

# Compress all supported images with SVGO
if [[ "${compress_svg}" -eq 1 ]]; then
  ${SVGO_PATH} -q -f "out/${EXTENSION_NAME}/images"
fi

# Compress all inline CSS with CSSO
if [[ "${compress_css}" -eq 1 ]]; then
  function minify_css() { 
    echo "$@" | sed -e 's/\\"/"/g' -e 's/\\\$/$/g' | ${CSSO_PATH} --declaration-list
  }
  export -f minify_css
  export CSSO_PATH
  for path in "out/${EXTENSION_NAME}/scripts"/{*,**/*}.js; do
    [[ ! -f "${path}" ]] && continue
    source=$(cat "${path}")
    echo "echo \"$(sed -e 's/\\/\\\\/g' -e 's/\$/\\$/g' -e 's/`/\\`/g' -e 's/\"/\\\"/g' -e 's/\\n/\\\\n/g' <<< "$source" \
      | tr '\n' '\f' \
      | sed -E 's/\/\*\*[[:space:]]+CSS[[:space:]]+\*\/[[:space:]]*\([[:space:]]*\\`([^`]*)\\`[[:space:]]*\)/\\`\$(minify_css '\''\1'\'')\\`/g' \
      | tr '\f' '\n')\"" \
      | sh > "${path}"
  done
fi

# Get current version from git if automatic versioning enabled
if [[ "${update_version}" -eq 1 ]]; then

  # Check we're inside a git work tree
  inside_git_repo="$(git rev-parse --is-inside-work-tree 2>/dev/null)"
  if [[ "${inside_git_repo}" ]]; then

    # Get number of commits and release version from most recent tag
    number_of_commits=$(($("${GIT_PATH}" rev-list HEAD --count) + 1))
    git_release_version=$("${GIT_PATH}" describe --tags --always --abbrev=0)
    git_release_version=${git_release_version%%-*};
    git_release_version=${git_release_version#*v};    

  # Otherwise issue warning and set blank version
  else
    echo "Warning: Unable to set version automatically as cannot find 'git' repository (ensure repository has been cloned to fix this)" >&2
    number_of_commits="0"
    git_release_version="0.0.0"
  fi
  
  # Helper performs multiline sed regular expression
  function multiline_sed_regex() {
    mv "$1" "$1.bak"
    echo -n "$(cat "$1.bak")" | tr "\n" "\f" | sed -E "$2" | tr "\f" "\n" > "$1"
    rm -rf "$1.bak"
  }
fi

# Make resources index file
import_list=""
resource_list=""
alias_list=""
resource_count=0
for path in "out/${EXTENSION_NAME}/scripts/resources"/*.js; do
  path="${path##*/}"
  [[ $path == "index.js" ]] && continue
  resource_count=$((resource_count+1))
  import_list="${import_list}"$'\n'"import * as r${resource_count} from \"./${path}\";"
  resource=$(<"out/${EXTENSION_NAME}/scripts/resources/${path}")
  regex_arr="(^|[ "$'\n'"])(const|let|var)[ "$'\n'"]+domain[ "$'\n'"]*=[ "$'\n'"]*\[([^]]+)\]"
  regex_val="(^|[ "$'\n'"])(const|let|var)[ "$'\n'"]+domain[ "$'\n'"]*="
  if [[ "$resource" =~ $regex_arr ]]; then
    IFS=", " read -a arr <<< "${BASH_REMATCH[3]}"
    resource_list="${resource_list}"$'\n'"resources[${arr[0]}] = r${resource_count}.resource;"
    for ((i=1;i<${#arr[@]};i++)); do
      alias_list="${alias_list}"$'\n'"resources[${arr[$i]}] = resources[${arr[0]}];"
    done
  elif [[ "$resource" =~ $regex_val ]]; then
    resource_list="${resource_list}"$'\n'"resources[r${resource_count}.domain] = r${resource_count}.resource;"
  else
    echo "Warning: No domain's listed for resource '${path}'" >&2
  fi
done

{
cat <<EOF
/** Auto-generated file **/
${import_list}

export const resources = {};
${resource_list}
${alias_list}
EOF
} >"out/${EXTENSION_NAME}/scripts/resources/index.js"


for target in "${targets[@]}"; do
  
  echo "Building '${target}' extension"
  
  # Set target specific flags
  case $target in
    safari-legacy)
      browser=1
      target_extension=".safariextension"
      common_file_path=""
      ;;
    *) exit 1
  esac
  
  # Make target folder
  mkdir -p "out/${EXTENSION_NAME}-${target}${target_extension}${common_file_path}"
  
  # Copy items from common output folder to target folder
  cp -r "out/${EXTENSION_NAME}"/* "out/${EXTENSION_NAME}-${target}${target_extension}${common_file_path}/"

  # Copy target specific items to target output folder
  cp -r "src/${target}"/* "out/${EXTENSION_NAME}-${target}${target_extension}/" 2>/dev/null
  
  
  # Use closure compiler to compress javascript
  function remove_element() {
    for i in "${!files[@]}"; do
      if [[ ${files[$i]} = "$1" ]]; then
        unset "files[$i]"
      fi
    done
  }
  
  function add_element() {
    remove_element "$1"
    files+=("$1")
  }
  
  function get_absolute_path() {
    local dirname="${1%/*}"
    local basename="${1##*/}"
    
    echo "$(cd "$dirname" 2>/dev/null; pwd)/$basename"
  }
  
  # Convert absolute paths to platform native path on Windows 
  function fix_absolute_path() {
    case "$(uname -s)" in
      CYGWIN*|MINGW32*|MSYS*)
        echo "$(cygpath -wa ${1})"
        ;;
      *) echo "$1"
    esac
  }
  
  function process_file() {
    local dirname="${1%/*}"
    local imports=()
    
    if [[ ! -f "$1" ]]; then
      remove_element "$1"
      return
    fi
    
    local source=$(<"$1")
    regex="(^| |"$'\n'")(import|export)["$'\n'" ]+(([*a-zA-Z0-9_,{}"$'\n'" $]+)from["$'\n'" ]+)?['\"]([^'\"]+)['\"][ "$'\n'";]"
    while true; do
      if [[ "$source" =~ $regex ]]; then
        source="${source##*${BASH_REMATCH[0]}}"
        imports+=("${BASH_REMATCH[5]}")
      else
        break
      fi
    done
  
    for i in "${!imports[@]}"; do
      imports[$i]=$(cd "$dirname"; get_absolute_path "${imports[$i]}")
      add_element "${imports[$i]}"
    done
    
    for i in "${!imports[@]}"; do
      process_file "${imports[$i]}"
    done
  }


  scripts_path=$(get_absolute_path "out/${EXTENSION_NAME}-${target}${target_extension}${common_file_path}/scripts")
  defines_path="${scripts_path}/defines.js"
  extern_path=$(fix_absolute_path "${scripts_path}/externs.js")

  defines_processed_path=$(echo "${defines_path%.*}" | sed -E 's|[/@\]|$|g' | sed -E 's/[-. ]/_/g' | sed -e 's/\[/%5B/g' -e 's/]/%5D/g' -e 's/>/%3E/g' -e 's/</%3C/g')
  logging_flag="LOGGING_LEVEL$\$module${defines_processed_path}=${logging_level}"


  for entry in "${SOURCE_FILES[@]}"; do
    files=()
    
    absolute_entry="${scripts_path}/${entry}"
    [[ ! -f "$absolute_entry" ]] && continue
    
    add_element "$absolute_entry"
    process_file "$absolute_entry"

    absolute_entry=$(fix_absolute_path "$absolute_entry")

    defines=()
    js_code=()
    for path in "${files[@]}"; do
      path=$(fix_absolute_path "$path")
      js_code=("--js" "$path" "${js_code[@]}")
      if [[ "$path" = "$defines_path" ]]; then
        defines=(
          "--define" "$logging_flag"
        )
      fi
    done 
  
    if [[ "$debug_js" -eq 0 ]]; then
      source_map_options=()
    else
      source_map_options=(
        --create_source_map "${absolute_entry}.map"
        --source_map_location_mapping "$scripts_path|."
        --source_map_include_content
      )
    fi

    if [[ "$compress_js" -eq 0 ]]; then
      compression_options=(
        --compilation_level WHITESPACE_ONLY \
        --js_module_root "$scripts_path" \
        --formatting PRETTY_PRINT \
        --formatting PRINT_INPUT_DELIMITER \
      )
    else
      compression_options=(
        --compilation_level ADVANCED \
        --use_types_for_optimization \
        --assume_function_wrapper \
        --jscomp_error strictCheckTypes \
        --jscomp_error strictMissingProperties \
        --jscomp_error checkTypes \
        --jscomp_error checkVars \
        --jscomp_error reportUnknownTypes \
        --externs "$extern_path" \
        "${defines[@]}" \
      )
    fi
        
    ${CCJS_PATH} \
      "${compression_options[@]}" \
      --warning_level VERBOSE \
      "${source_map_options[@]}" \
      "${js_code[@]}" \
    > "${absolute_entry%.*}.cjs"

  done

  # Remove uncompiled JavaScript
  rm -f "${scripts_path}/"{*,**/*}.js
  
  # Remove any empty folders
  for path in "${scripts_path}/"{*,**/*}; do
    if [[ -d "$path" ]] && [[ ! -f "$path"/* ]]; then
      rm -rf "$path"
    fi
  done
  
  # Restore '.js' extension for compiled JavaScript
  for entry in "${SOURCE_FILES[@]}"; do
    entry="${scripts_path}/"${entry%.*}
    [ ! -f "${entry}.cjs" ] && continue
    mv "${entry}.cjs" "${entry}.js"
  done
  
  # Embed source maps and remove map files
  if [[ "$debug_js" -eq 1 ]]; then
    for entry in "${SOURCE_FILES[@]}"; do
      entry="${scripts_path}/${entry}"
      [[ ! -f "${entry}" ]] && continue
      source_map=$(base64 "${entry}.map" | tr -d \\n)
      echo "//# sourceMappingURL=data:application/json;base64,${source_map}" >> "${entry}"
      rm -f "${entry}.map"
    done
  fi


  # Safari specific build steps
  if [[ "${target}" == "safari-legacy" ]]; then

    # Remove irrelevant target file
    rm -f "out/${EXTENSION_NAME}-${target}${target_extension}/update.plist"

    # Update version info from git
    if [[ "${update_version}" -eq 1 ]]; then
      info_plist="out/${EXTENSION_NAME}-${target}${target_extension}/Info.plist"
      update_plist="src/${target}/update.plist"
      multiline_sed_regex "${info_plist}" "s|(> *CFBundleShortVersionString *</key>[^>]+>)[^<]+|\1${git_release_version}|g"
      multiline_sed_regex "${info_plist}" "s|(> *CFBundleVersion *</key>[^>]+>)[^<]+|\1${number_of_commits}|g"
      multiline_sed_regex "${update_plist}" "s|(> *CFBundleShortVersionString *</key>[^>]+>)[^<]+|\1${git_release_version}|g"
      multiline_sed_regex "${update_plist}" "s|(> *CFBundleVersion *</key>[^>]+>)[^<]+|\1${number_of_commits}|g"
    fi
    
    # Package safari extension
    if [[ "${package_ext}" -eq 1 ]] && [[ -f "out/${PRIVATE_KEY_PATH}" ]]; then
      (cd out && ${XARJS_PATH} create "${EXTENSION_NAME}-${target}.safariextz" --cert "${LEAF_CERT_PATH}" --cert "${INTERMEDIATE_CERT_PATH}" --cert "${ROOT_CERT_PATH}" --private-key "${PRIVATE_KEY_PATH}" "${EXTENSION_NAME}-${target}${target_extension}")
      rm -rf "out/${EXTENSION_NAME}-${target}${target_extension}"
    fi

  fi
  
done

# Clean common output folder
rm -rf "out/${EXTENSION_NAME}"

echo "Done."
