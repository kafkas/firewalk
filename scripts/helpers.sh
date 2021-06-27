#!/bin/sh

function join_by() {
    local d=${1-} f=${2-}
    if shift 2; then printf %s "$f" "${@/#/$d}"; fi
}

function validate_package() {
    local package_name=$1
    if [ "$package_name" != "admin" ]; then
        echo "Error: Incorrect package. Must be \"admin\"."
        exit 1
    fi
}
