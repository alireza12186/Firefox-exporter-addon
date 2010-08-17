#/bin/bash

extName="exporter.xpi"

if [ -f $extName ]
	then
		rm $extName
		echo -e "removing old version	[\e[00;32mOK\e[00m]"
	fi

zip -rq $extName "chrome/" "chrome.manifest" "install.rdf"
echo -e "creating new archive	[\e[00;32mOK\e[00m]"

echo -e "----------------------------"
find ./ -not -type d -and -not -name "make.sh" -and -not -iname "*.xpi" -and -not -path "./archive/*" -and -not -ipath "*.git*" | xargs wc -l | tail -n 1

