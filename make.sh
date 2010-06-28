#/bin/bash

extName="exporter.xpi"

if [ -f $extName ]
	then
		rm $extName
		echo -e "removing old version	[\e[00;32mOK\e[00m]"
	fi

zip -rq $extName "chrome/" "chrome.manifest" "install.rdf"
echo -e "creating new archive	[\e[00;32mOK\e[00m]"

let LINES=`find ./ -not -type d -and -not -name "make.sh" -and -not -iname "*.xpi" -and -not -iname "*.ogv" | xargs wc -l | cut -c 1-8 | awk '{total += $1} END {print total}'`
echo -e "----------------------------"
echo -e "total lines		\e[00;32m$LINES\e[00m"

