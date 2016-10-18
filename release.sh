#!/bin/bash

# Increment version number (by default, patch increment)
echo
echo "Given a version number MAJOR.MINOR.PATCH, increment the:"
echo
echo "    MAJOR version when you make incompatible API changes,"
echo "    MINOR version when you add functionality in a backwards-compatible manner, and"
echo "    PATCH version when you make backwards-compatible bug fixes."
echo
echo "Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format."
echo
echo -e "See \033[4m\033[36mhttp://semver.org"
echo -e "\033[0mCopyright (C) Appfeel 2016, \033[4m\033[36mhttp://appfeel.com"
echo -e "\033[0mLICENSE: MIT"
echo

oldVersion=`npm view . version`
IFS='.' read -r -a version <<< "$oldVersion"
newMinor=$((version[2] + 1))
newVersion="${version[0]}.${version[1]}.$newMinor"
echo
echo "Introduce the old version to skip npm publishing (just create a Github release)"
read -e -p "Old version: $oldVersion. New version: [$newVersion] " version
version=${version:-"$newVersion"}

# If tag already exists, remove it silently (no errors)
git tag -d "$version" > /dev/null
git push origin :refs/tags/"$version" > /dev/null

if [ "$version" != "$oldVersion" ]; then
    npm version "$version"
    git push
fi

# Read package name and path and prepare release data
strValues=$(node -pe 'var package = require("./package.json"); package.name + ", " + package.version + ", " + package.repository.url.replace("https://github.com/", "").replace(".git", "")')
IFS=', ' read -r -a values <<< "$strValues"
name=${values[0]}
version=${values[1]}
path=${values[2]}
apiPath="https://api.github.com/repos"

read -p "Github username (leave blank for non authenticated requests): " username
if [ ! -z "$username" ]; then
    read -s -p "Password: " pw
    echo
fi
read -p "Release body: [release $name@$version] " body
body=${body:-"release $name@$newVersion"}
data='{"tag_name": "v'$version'",
"target_commitish": "master",
"name": "v'$version'",
"body": "'$body'",
"draft": false,
"prerelease": false}'

# Creating Github release
if [ ! -z "$username" ]; then
    echo -e "\033[33mCreating release \033[1m$name@$version\033[0m\033[33m... ($apiPath/$path/releases)"
    strResponse=`curl -i -X POST "$apiPath/$path/releases" -H "Content-type: application/json" -d "$data" -u "$username:$pw"`
else
    echo -e "\033[33mCreating release \033[1m$name@$version\033[0m\033[33m... ($apiPath/$path/releases)"
    strResponse=`curl -i -X POST "$apiPath/$path/releases" -H "Content-type: application/json" -d "$data"`
fi

IFS=' ' read -r -a response <<< "$strResponse"

# Publishing to npm
if [ "$version" != "$oldVersion" ]; then
    if [ "${response[1]}" != 201 ]; then
        echo -e "\033[31mERROR: package will not be published to npm."
        echo -e "\033[31m$strResponse"
        
        echo -e "\033[0mReverting version..."
        npm version "$oldVersion"
        git push

    else
        echo -e "\033[0m$strResponse"
        echo -e "\033[32mPublishing to npm..."
        npm publish .
    fi
elif [ "${response[1]}" != 201 ]; then
    echo -e "\033[31mERROR:"
    echo -e "\033[31m$strResponse"
fi

echo -e "\033[0m"